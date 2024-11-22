import { CfnOutput, CustomResource, Duration, NestedStack } from 'aws-cdk-lib'
import {
  AdvancedSecurityMode,
  UserPool,
  UserPoolClient,
  UserPoolEmail,
  UserPoolOperation
} from 'aws-cdk-lib/aws-cognito'
import { IVpc, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2'
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Construct } from 'constructs'
import { DatabaseConnectable } from './database'
import { Provider } from 'aws-cdk-lib/custom-resources'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import path = require('path')

export class Cognito extends NestedStack {
  public userPool: UserPool
  public userPoolClient: UserPoolClient

  constructor (
    scope: Construct,
    id: string,
    props: { vpc: IVpc; dbConnection: DatabaseConnectable; sg: SecurityGroup; }
  ) {
    super(scope, id)

    this.userPool = new UserPool(this, 'rssAggregatorUserpool', {
      userPoolName: 'rssAggregator',
      selfSignUpEnabled: true,
      standardAttributes: {
        email: { required: true, mutable: false }
      },
      signInAliases: {
        email: true,
        username: false,
        phone: false
      },
      autoVerify: { email: true, phone: true },
      passwordPolicy: {
        minLength: 8,
        requireDigits: true,
        requireLowercase: false,
        requireSymbols: true,
        requireUppercase: true,
        tempPasswordValidity: Duration.days(90)
      },
      advancedSecurityMode: AdvancedSecurityMode.ENFORCED,
      email: UserPoolEmail.withCognito()
    })

    const client = this.userPool.addClient('rssAggregatorClient', {
      userPoolClientName: 'rssAggregatorClientApp',
      generateSecret: false,
      authFlows: {
        userPassword: true
      }
    })
    this.userPoolClient = client;

    const signUpLambda = new NodejsFunction(
      this,
      'rssAggregatorInitiateFunction',
      {
        timeout: Duration.seconds(600),
        runtime: Runtime.NODEJS_20_X,
        entry: './lib/signup-add-email/src/index.ts',
        environment: {
          DB_HOST: props.dbConnection.endpoint,
          DB_USERNAME: 'rssAggregator',
          DB_NAME: 'rssAggregator',
          USES_PROXY: props.dbConnection.isProxy.toString()
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
        vpc: props.vpc,
        securityGroups: [props.sg],
        handler: 'handler',
        vpcSubnets: props.vpc.selectSubnets({
          subnetType: SubnetType.PRIVATE_WITH_EGRESS
        })
      }
    )

    props.dbConnection.grantConnect(signUpLambda)

    this.userPool.addTrigger(UserPoolOperation.PRE_SIGN_UP, signUpLambda)

    const guestLambda = new NodejsFunction(
      this,
      'rssAggregatorGuestCreationFunction',
      {
        timeout: Duration.seconds(600),
        runtime: Runtime.NODEJS_20_X,
        entry: './lib/signup-add-guest-account/src/index.ts',
        environment: {
          CLIENT_ID: client.userPoolClientId,
          USERNAME: 'RssAggregatorDemoUser@rssaggregatorsample.com',
          PASSWORD: 'RssAggregatorDemoUser123!',
          USER_POOL_ID: this.userPool.userPoolId,
        },
        tracing: Tracing.ACTIVE,
        vpc: props.vpc,
        securityGroups: [props.sg],
        handler: 'handler',
        vpcSubnets: props.vpc.selectSubnets({
          subnetType: SubnetType.PRIVATE_WITH_EGRESS
        })
      }
    )

    this.userPool.grant(guestLambda, 'cognito-idp:CreateGroup', 'cognito-idp:AdminAddUserToGroup')

    const customResourceGuestProvider = new Provider(
      this,
      'rssAggregatorGuestCreationProvider',
      {
        onEventHandler: guestLambda,
        logRetention: RetentionDays.ONE_DAY
      }
    )

    const guestCreation = new CustomResource(this, 'rssAggregatorInitiateTopics', {
      serviceToken: customResourceGuestProvider.serviceToken,
      resourceType: 'Custom::rssAggregatorCreateGuest'
    })

    guestCreation.node.addDependency(signUpLambda)

    new CfnOutput(this, 'userPool', {
      key: 'userPoolId',
      value: this.userPool.userPoolId
    })
    new CfnOutput(this, 'clientId', {
      key: 'clientId',
      value: client.userPoolClientId
    })
  }
}
