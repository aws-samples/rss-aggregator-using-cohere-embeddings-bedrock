import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { DiscoverDatabase } from './database'
import { Cognito } from './cognito'
import { API } from './api'
import { Events } from './events'
import { BackendCache } from './cloudfront'
import { FrontEnd } from './frontend'
import { Bucket, BucketAccessControl } from 'aws-cdk-lib/aws-s3'
import { RemovalPolicy } from 'aws-cdk-lib'

export class RssAggregatorStack extends cdk.Stack {
  constructor (scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const vpc = ec2.Vpc.fromLookup(this, 'vpcLookup', {
      vpcId: this.node.tryGetContext('vpc_id')
    })

    const serverAccessLogsBucket = new Bucket(this, 'rssAggregatorAccessLogs', { 
      accessControl: BucketAccessControl.PRIVATE,
      enforceSSL: true,
      bucketName: `rss-aggreagtor-access-logs-${process.env.CDK_DEFAULT_ACCOUNT}`,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    // Add a private VPC endpoint for Secrets Manager.
    vpc.addInterfaceEndpoint('secretEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      privateDnsEnabled: false
    })

    const db = new DiscoverDatabase(this, 'rssAggregatorDatabase', vpc)
    const cognito = new Cognito(this, 'rssAggregatorCognito', {
      vpc,
      dbConnection: db.connection,
      sg: db.securityGroup
    })
    const events = new Events(this, 'rssAggregatorEvents', {
      vpc,
      dbConnection: db.connection,
      sg: db.securityGroup,
      cognito: cognito.userPool
    })
    const api = new API(this, 'rssAggregatorApi', {
      vpc,
      dbConnection: db.connection,
      sg: db.securityGroup,
      cognito: cognito.userPool,
      eventBus: events.eventBus
    })

    const cloudfront = new BackendCache(this, 'rssAggregatorCDN', {
      restApi: api.api,
      serverAccessLogsBucket
    })

    const frontEnd = new FrontEnd(this, 'rssAggregatorFrontend', { 
      userPool: cognito.userPool,
      userPoolClient: cognito.userPoolClient,
      apiUri: cloudfront.distribution.domainName,
      serverAccessLogsBucket
    });
  }
}
