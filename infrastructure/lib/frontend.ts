import { Construct } from 'constructs'
import {
  Distribution,
  OriginAccessIdentity,
  SecurityPolicyProtocol
} from 'aws-cdk-lib/aws-cloudfront'
import { Bucket, BucketAccessControl, IBucket, ObjectOwnership } from 'aws-cdk-lib/aws-s3'
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment'
import path = require('path')
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import {
  AwsCustomResource,
  PhysicalResourceId,
  AwsCustomResourcePolicy
} from 'aws-cdk-lib/custom-resources'
import { CfnOutput, NestedStack, RemovalPolicy } from 'aws-cdk-lib'

export class FrontEnd extends NestedStack {
  constructor (
    scope: Construct,
    id: string,
    props: {
      userPool: UserPool
      userPoolClient: UserPoolClient
      apiUri: string
      serverAccessLogsBucket: IBucket
    }
  ) {
    super(scope, id)

    const bucket = new Bucket(this, 'rssAggregatorFrontEndBucket', {
      accessControl: BucketAccessControl.PRIVATE,
      enforceSSL: true,
      bucketName: `rssa-ggreagtor-frontend-${process.env.CDK_DEFAULT_ACCOUNT}`,
      removalPolicy: RemovalPolicy.DESTROY,
      serverAccessLogsBucket: props.serverAccessLogsBucket,
      serverAccessLogsPrefix: 'rss-aggregator-frontend'
    })

    const deployment = new BucketDeployment(
      this,
      'rssAggregatorFrontEndDeployment',
      {
        destinationBucket: bucket,
        sources: [Source.asset(path.resolve(__dirname, '../../frontend/dist'))]
      }
    )

    const originAccessIdentity = new OriginAccessIdentity(
      this,
      'rssAggregatorOAI'
    )
    bucket.grantRead(originAccessIdentity)

    const config = {
      region: process.env.CDK_DEFAULT_REGION ?? 'eu-west-2',
      userPoolId: props.userPool.userPoolId,
      clientId: props.userPoolClient.userPoolClientId,
      apiEndpoint: `https://${props.apiUri}/`
    }

    const configUpload = new AwsCustomResource(this, 'rssAggregatorConfig', {
      logRetention: RetentionDays.ONE_DAY,
      onUpdate: {
        action: 'putObject',
        parameters: {
          Body: `var CONFIG = ${JSON.stringify(config)};`,
          Bucket: bucket.bucketName,
          CacheControl: 'max-age=0, no-cache, no-store, must-revalidate',
          ContentType: 'application/json',
          Key: 'config.js'
        },
        physicalResourceId: PhysicalResourceId.of(
          (Math.random() + 1).toString(36).substring(5)
        ), //Ensure this is always updated
        service: 'S3'
      },
      policy: AwsCustomResourcePolicy.fromStatements([
        new PolicyStatement({
          actions: ['s3:PutObject'],
          resources: [bucket.arnForObjects('config.js')]
        })
      ])
    })
    configUpload.node.addDependency(deployment)

    const distributionLoggingBucket = new Bucket(this, 'frontEndLoggingBucket', {
      accessControl: BucketAccessControl.PRIVATE,
      enforceSSL: true,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED,
      bucketName: `rssa-ggreagtor-frontend-cf-logging-${process.env.CDK_DEFAULT_ACCOUNT}`,
      removalPolicy: RemovalPolicy.DESTROY,
      serverAccessLogsBucket: props.serverAccessLogsBucket,
      serverAccessLogsPrefix: 'rss-aggregator-frontend-access-logs-'
    })

    const distribution = new Distribution(this, 'frontEndDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(bucket)
      },
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2018,
      enableLogging: true,
      logBucket: distributionLoggingBucket,
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html'
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html'
        }
      ]
    })

    new CfnOutput(this, 'frontEndUrl', {
      key: 'frontEndUrl',
      value: distribution.domainName
    })
  }
}
