import { Duration, NestedStack } from 'aws-cdk-lib'
import {
  AccessLogFormat,
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  EndpointType,
  LambdaIntegration,
  LogGroupLogDestination,
  MethodLoggingLevel,
  RestApi
} from 'aws-cdk-lib/aws-apigateway'
import { UserPool } from 'aws-cdk-lib/aws-cognito'
import { IVpc, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2'
import { EventBus } from 'aws-cdk-lib/aws-events'
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam'
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Construct } from 'constructs'
import { DatabaseConnectable } from './database'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import path = require('path')

export class API extends NestedStack {
  public api: RestApi

  constructor (
    scope: Construct,
    id: string,
    props: {
      vpc: IVpc
      dbConnection: DatabaseConnectable
      sg: SecurityGroup
      cognito: UserPool, 
      eventBus: EventBus,
    }
  ) {
    super(scope, id)

    const rssAggregatorLogGroup = new LogGroup(this, "rssAggregatorLogGroup", { retention: RetentionDays.ONE_WEEK });

    const rssAggregatorLambda = new NodejsFunction(this, 'rssAggregatorApi', {
      timeout: Duration.seconds(600),
      runtime: Runtime.NODEJS_LATEST,
      entry: '../api/src/lambda.ts',
      memorySize: 1024, 
      environment: {
        PG_HOST: props.dbConnection.endpoint,
        PG_USER: 'rssAggregator',
        PG_DB: 'rssAggregator',
        PG_PORT: '5432',
        PG_REGION: process.env.CDK_DEFAULT_REGION ?? 'eu-west-2',
        EVENTBRIDGE_NAME: props.eventBus.eventBusName,
        EVENTBRIDGE_ARN: props.eventBus.eventBusArn,
        USES_PROXY: props.dbConnection.isProxy.toString()
      },
      bundling: { 
        minify: true, 
        sourceMap: false, 
        sourcesContent: false, 
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
      tracing: Tracing.PASS_THROUGH,
      vpc: props.vpc,
      securityGroups: [props.sg],
      handler: 'handler',
      vpcSubnets: props.vpc.selectSubnets({
        subnetType: SubnetType.PRIVATE_WITH_EGRESS
      })
    })

    rssAggregatorLambda.addToRolePolicy(new PolicyStatement({ 
      effect: Effect.ALLOW,
      actions: [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      resources: [`arn:aws:bedrock:${process.env.CDK_DEFAULT_REGION}::foundation-model/cohere.embed-english-v3`]
    }))

    props.eventBus.grantPutEventsTo(rssAggregatorLambda)
    props.dbConnection.grantConnect(rssAggregatorLambda)

    const authorizer = new CognitoUserPoolsAuthorizer(
      this,
      'rssAggregatorAuthorizer',
      {
        cognitoUserPools: [props.cognito]
      }
    )

    const api = new RestApi(this, `rssAggregatorRestAPI`, {
      endpointTypes: [EndpointType.REGIONAL],
      cloudWatchRole: true,
      deployOptions: {
        stageName: 'v1',
        tracingEnabled: true,
        loggingLevel: MethodLoggingLevel.INFO,
        accessLogDestination: new LogGroupLogDestination(rssAggregatorLogGroup),
        accessLogFormat: AccessLogFormat.jsonWithStandardFields(),
      },
      defaultCorsPreflightOptions: { 
        allowCredentials: true,
        allowOrigins: Cors.ALL_ORIGINS, allowMethods: Cors.ALL_METHODS,
      },
      defaultMethodOptions: {
        authorizationType: AuthorizationType.COGNITO,
        authorizer,
      }
    })
    
    api.addRequestValidator("validateRequest", {
      validateRequestBody: true,
      validateRequestParameters: true,
      requestValidatorName: 'rssAggregatorvalidator'
    })

    this.api = api


    const parent = api.root
    const feeds = parent.addResource("feeds")
    feeds.addMethod('GET', new LambdaIntegration(rssAggregatorLambda))
    feeds.addMethod('POST', new LambdaIntegration(rssAggregatorLambda));

    const feedsProxy = feeds.addProxy({ anyMethod: false})
    feedsProxy.addMethod('DELETE', new LambdaIntegration(rssAggregatorLambda))
    feedsProxy.addMethod('PATCH', new LambdaIntegration(rssAggregatorLambda))

    const validate = feeds.addResource("validate");
    validate.addMethod('POST', new LambdaIntegration(rssAggregatorLambda));

    const items = parent.addResource("items")
    const itemGetMethod = items.addMethod('GET', new LambdaIntegration(rssAggregatorLambda), { 
      requestParameters: { 
        'method.request.querystring.limit': true,
        'method.request.querystring.page': true,
        'method.request.querystring.feedId': true, 
        'method.request.querystring.topicId': true,
      }
    });

    const topics = parent.addResource("topics")
    const topicGet = topics.addMethod('GET', new LambdaIntegration(rssAggregatorLambda));
    const topicPost = topics.addMethod('POST', new LambdaIntegration(rssAggregatorLambda));
    const topicsProxy = topics.addProxy({ anyMethod: false})
    const topicPatch = topicsProxy.addMethod('PATCH', new LambdaIntegration(rssAggregatorLambda));
    const topicDelete = topicsProxy.addMethod('DELETE', new LambdaIntegration(rssAggregatorLambda));
    
    const search = parent.addResource("search")
    const searchPost = search.addMethod('POST', new LambdaIntegration(rssAggregatorLambda));
  }
}
