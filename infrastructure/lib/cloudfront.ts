import {
  RestApi
} from 'aws-cdk-lib/aws-apigateway'
import { AllowedMethods, CacheCookieBehavior, CacheHeaderBehavior, CachePolicy, CacheQueryStringBehavior, Distribution, OriginRequestPolicy, SecurityPolicyProtocol, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront'
import { Construct } from 'constructs'
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { CfnOutput, Duration, NestedStack, RemovalPolicy } from 'aws-cdk-lib';
import { Bucket, BucketAccessControl, IBucket, ObjectOwnership } from 'aws-cdk-lib/aws-s3';

export class BackendCache extends NestedStack {
  public distribution: Distribution

  constructor (
    scope: Construct,
    id: string,
    props: {
      restApi: RestApi,
      serverAccessLogsBucket: IBucket,
    }
  ) {
    super(scope, id)

    const backendDistributionLogging = new Bucket(this, 'backendBucket', { 
      accessControl: BucketAccessControl.PRIVATE,
      enforceSSL: true,
      bucketName: `rss-aggregator-backend-cache-logging-${process.env.CDK_DEFAULT_ACCOUNT}`,
      removalPolicy: RemovalPolicy.DESTROY,
      serverAccessLogsBucket: props.serverAccessLogsBucket,
      serverAccessLogsPrefix: 'rss-aggregator-cache-logs',
      objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED
    })

    const distribution = new Distribution(this, 'cloudfrontDistribution', {
        minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_1_2016,   
        defaultBehavior: { 
            origin: new cloudfront_origins.RestApiOrigin(props.restApi),
            compress: true,
            allowedMethods: AllowedMethods.ALLOW_ALL,
            viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: new CachePolicy(this, 'rssAggreagtorCachePolicy', { 
                headerBehavior: CacheHeaderBehavior.none(),
                cookieBehavior: CacheCookieBehavior.none(),
                queryStringBehavior: CacheQueryStringBehavior.all(),
                minTtl: Duration.seconds(0),
                maxTtl: Duration.seconds(3600),
                defaultTtl: Duration.seconds(60),
                enableAcceptEncodingGzip: true,
                enableAcceptEncodingBrotli: true
            }),
            originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER
        },
        enableLogging: true,
        logBucket: backendDistributionLogging
    })
    this.distribution = distribution;

    new CfnOutput(this, 'distributionUrl', { key: 'distributionUrl', value: distribution.domainName })
  }
}
