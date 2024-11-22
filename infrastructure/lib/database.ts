import { Construct } from 'constructs'
import * as secrets from 'aws-cdk-lib/aws-secretsmanager'
import * as rds from 'aws-cdk-lib/aws-rds'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as cdk from 'aws-cdk-lib'
import * as kms from 'aws-cdk-lib/aws-kms'
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Provider } from 'aws-cdk-lib/custom-resources'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { CustomResource } from 'aws-cdk-lib'
import path = require('path')
import { SecretRotationApplication } from 'aws-cdk-lib/aws-secretsmanager'
import { Topic } from 'aws-cdk-lib/aws-sns'
export type DatabaseConnectable = {
  endpoint: string
  grantConnect(grantee: iam.IGrantable): iam.Grant
  isProxy: boolean
}

export class DiscoverDatabase extends cdk.NestedStack {
  cluster: rds.DatabaseCluster
  connection: DatabaseConnectable
  credentials: secrets.Secret
  securityGroup: ec2.SecurityGroup

  constructor (scope: Construct, id: string, vpc: ec2.IVpc) {
    super(scope, id)

    const dbCredentials = new secrets.Secret(this, 'rssAggregatorSecretDB', {
      secretName: 'rssAggregator-db-credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'rssAggregator'
        }),
        excludePunctuation: true,
        includeSpace: false,
        generateStringKey: 'password',
      }
    })

    const awsSnsKey = kms.Alias.fromAliasName(
      this,
      "aws-managed-sns-kms-key",
      "alias/aws/sns",
    )
    
    const snsTopic = new Topic(this, 'rdsSnsTopic', { 
      topicName: 'rdsEventsSnsTopic',
      enforceSSL: true,
      masterKey: awsSnsKey
    });
    

    this.credentials = dbCredentials

    const proxyToDb = new ec2.SecurityGroup(this, 'proxyToDB', {
      vpc
    })
    this.securityGroup = proxyToDb
    proxyToDb.addIngressRule(proxyToDb, ec2.Port.tcp(5432), 'allowDbConn')

    const serverlessCluster = new rds.DatabaseCluster(this, 'rssAggregatorDb', {
      credentials: rds.Credentials.fromSecret(dbCredentials),
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_16_2
      }),
      deletionProtection: true,
      serverlessV2MinCapacity: this.node.tryGetContext('minAcu') ? parseInt(this.node.tryGetContext('minAcu')) : 0.5,
      serverlessV2MaxCapacity: this.node.tryGetContext('maxAcu') ? parseInt(this.node.tryGetContext('maxAcu')) : 1,
      iamAuthentication: true,
      port: 5432,
      clusterIdentifier: 'db-rssAggregator',
      defaultDatabaseName: 'rssAggregator',
      vpc: vpc,  
      storageEncrypted: true,
      backup: { 
        retention: cdk.Duration.days(7)
      },
      vpcSubnets: vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      }),
      securityGroups: [proxyToDb],
      writer: rds.ClusterInstance.serverlessV2('writer', {
        autoMinorVersionUpgrade: true,
        publiclyAccessible: false,
      }),

    })

    this.cluster = serverlessCluster

    new secrets.SecretRotation(this, 'rssAggregatorSecretRotation', { 
      application: SecretRotationApplication.POSTGRES_ROTATION_SINGLE_USER,
      secret: dbCredentials,
      target: serverlessCluster,
      vpc
    })

    let dbConnection = {
      endpoint: serverlessCluster.clusterEndpoint.hostname,
      grantConnect: (grantable: iam.IGrantable) =>
        serverlessCluster.grantConnect(grantable, 'rssAggregator'),
      isProxy: false
    }
    if (this.node.tryGetContext('useDbProxy') === 'true') {
      const proxy = serverlessCluster.addProxy('rssAggregatorDbProxy', {
        secrets: [dbCredentials],
        securityGroups: [proxyToDb],
        iamAuth: true,
        vpc
      })

      dbConnection = {
        endpoint: proxy.endpoint,
        grantConnect: (grantable: iam.IGrantable) => proxy.grantConnect(grantable, 'rssAggregator'),
        isProxy: true
      }
    }
    this.connection = dbConnection

    const rdsNotifications = new rds.CfnEventSubscription(this, 'rdsEventSubscription', { 
      snsTopicArn: snsTopic.topicArn,
      enabled: true,
      sourceIds: [serverlessCluster.clusterIdentifier],
      sourceType: 'db-cluster',
      subscriptionName: 'rssAggregator-db-events'
    })

    const createSql = new NodejsFunction(this, 'rssAggregatorInitiateFunction', {
      timeout: cdk.Duration.seconds(600),
      runtime: Runtime.NODEJS_LATEST,
      entry: './lib/sql-custom-resource/src/index.ts',
      environment: {
        DB_HOST: dbConnection.endpoint,
        DB_USERNAME: 'rssAggregator',
        DB_NAME: 'rssAggregator',
        USES_PROXY: dbConnection.isProxy.toString(),
        SECRET_ID: dbCredentials.secretArn,
      },
      bundling: { 
        commandHooks: {
          beforeBundling(inputDir: string, outputDir: string): string[] {
            return [`cp -r "${path.join(__dirname, '../resources/global-bundle.pem')}" "${outputDir}"`]
          },
          afterBundling(inputDir: string, outputDir: string): string[] {
            return []
          },
          beforeInstall(inputDir: string, outputDir: string): string[] {
            return []
          },
        },
      },
      tracing: Tracing.ACTIVE,
      vpc,
      handler: 'handler',
      securityGroups: [proxyToDb],
      vpcSubnets: vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      })
    })
    createSql.node.addDependency(serverlessCluster)
    const granted = dbConnection.grantConnect(createSql)
    dbCredentials.grantRead(createSql)
    const customResourceProvider = new Provider(
      this,
      'rssAggregatorInitiateProvider',
      {
        onEventHandler: createSql,
        logRetention: RetentionDays.ONE_DAY
      }
    )

    const resource = new CustomResource(this, 'rssAggregatorInitiateResource', {
      serviceToken: customResourceProvider.serviceToken,
      resourceType: 'Custom::rssAggregatorInitiate'
    })
    resource.node.addDependency(granted)

    const createTopics = new NodejsFunction(this, 'rssAggregatorInitiateTopicsFunction', {
      timeout: cdk.Duration.seconds(900),
      runtime: Runtime.NODEJS_LATEST,
      entry: '../retrieval/src/populate.ts',
      environment: {
        PG_HOST: dbConnection.endpoint,
        PG_PORT: '5432',
        PG_USER: 'rssAggregator',
        PG_DB: 'rssAggregator',
        USES_PROXY: dbConnection.isProxy.toString()
      },
      bundling: { 
        commandHooks: {
          beforeBundling(inputDir: string, outputDir: string): string[] {
            return [`cp -r "${path.join(__dirname, '../resources/global-bundle.pem')}" "${outputDir}"`]
          },
          afterBundling(inputDir: string, outputDir: string): string[] {
            return []
          },
          beforeInstall(inputDir: string, outputDir: string): string[] {
            return []
          },
        },
      },
      tracing: Tracing.ACTIVE,
      vpc,
      handler: 'handler',
      securityGroups: [proxyToDb],
      vpcSubnets: vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      })
    })

    dbConnection.grantConnect(createTopics);
    createTopics.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      resources: [`arn:aws:bedrock:${process.env.CDK_DEFAULT_REGION}::foundation-model/cohere.embed-english-v3`]

    }))

    const customResourceTopicProvider = new Provider(
      this,
      'rssAggregatorInitiateTopicProvider',
      {
        onEventHandler: createTopics,
        logRetention: RetentionDays.ONE_DAY
      }
    )

    const topicsPopulate = new CustomResource(this, 'rssAggregatorInitiateTopics', {
      serviceToken: customResourceTopicProvider.serviceToken,
      resourceType: 'Custom::rssAggregatorInitiateTopics'
    })

    topicsPopulate.node.addDependency(resource)
  }
}
