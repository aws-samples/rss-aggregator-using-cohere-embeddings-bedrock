#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { RssAggregatorStack } from '../lib/rss-aggregator-with-embeddings-stack'
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag'

const app = new cdk.App()
const stack = new RssAggregatorStack(app, 'RssAggregatorStackAppStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
})

// // Suppressions for CDK custom resources.
NagSuppressions.addResourceSuppressionsByPath(
  stack,
  [
    '/RssAggregatorStackAppStack/rssAggregatorDatabase/rssAggregatorInitiateTopicProvider/framework-onEvent/ServiceRole/DefaultPolicy/Resource',
    '/RssAggregatorStackAppStack/rssAggregatorCognito/rssAggregatorGuestCreationProvider/framework-onEvent/ServiceRole/DefaultPolicy/Resource',
    '/RssAggregatorStackAppStack/rssAggregatorDatabase/rssAggregatorInitiateProvider/framework-onEvent/ServiceRole/DefaultPolicy/Resource',
    '/RssAggregatorStackAppStack/rssAggregatorCognito/rssAggregatorUserpool/smsRole/Resource',
    '/RssAggregatorStackAppStack/rssAggregatorFrontend/Custom::CDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C/ServiceRole/DefaultPolicy/Resource',
    '/RssAggregatorStackAppStack/rssAggregatorFrontend/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/DefaultPolicy/Resource',

  ],
  [
    {
      id: 'AwsSolutions-IAM5',
      reason: 'Custom Resources - Not controlled by us'
    },
    {
      id: 'AwsSolutions-L1',
      reason: 'Custom Resources - Not controlled by us'
    }
  ]
)

// CORS Suppressions
NagSuppressions.addResourceSuppressionsByPath(
  stack,
  [
    '/RssAggregatorStackAppStack/rssAggregatorApi/rssAggregatorRestAPI/Default/OPTIONS/Resource',
    '/RssAggregatorStackAppStack/rssAggregatorApi/rssAggregatorRestAPI/Default/feeds/OPTIONS/Resource',
    '/RssAggregatorStackAppStack/rssAggregatorApi/rssAggregatorRestAPI/Default/feeds/{proxy+}/OPTIONS/Resource',
    '/RssAggregatorStackAppStack/rssAggregatorApi/rssAggregatorRestAPI/Default/feeds/{proxy+}/OPTIONS/Resource',
    '/RssAggregatorStackAppStack/rssAggregatorApi/rssAggregatorRestAPI/Default/feeds/validate/OPTIONS/Resource',
    '/RssAggregatorStackAppStack/rssAggregatorApi/rssAggregatorRestAPI/Default/items/OPTIONS/Resource',
    '/RssAggregatorStackAppStack/rssAggregatorApi/rssAggregatorRestAPI/Default/topics/OPTIONS/Resource',
    '/RssAggregatorStackAppStack/rssAggregatorApi/rssAggregatorRestAPI/Default/topics/{proxy+}/OPTIONS/Resource',
    '/RssAggregatorStackAppStack/rssAggregatorApi/rssAggregatorRestAPI/Default/search/OPTIONS/Resource'
  ],
  [
    {
      id: 'AwsSolutions-APIG4',
      reason: 'Default Cors Options not included with Auth'
    },
    {
      id: 'AwsSolutions-COG4',
      reason: 'Default Cors Options not included with Cognito'
    }
  ]
)

// Default Cloudfront Domains
NagSuppressions.addResourceSuppressionsByPath(
  stack,
  [
    '/RssAggregatorStackAppStack/rssAggregatorCDN/cloudfrontDistribution/Resource',
    '/RssAggregatorStackAppStack/rssAggregatorFrontend/frontEndDistribution/Resource'
  ],
  [
    {
      id: 'AwsSolutions-CFR4',
      reason:
        'All Default Cloudfront Domains use TLSv1 (See: https://github.com/cdklabs/cdk-nag/issues/1320)'
    }
  ]
)

// Lambda Related Executions and CDK Defaults.
NagSuppressions.addStackSuppressions(stack, [
  {
    id: 'AwsSolutions-IAM4',
    reason: 'Covers the Lambda Execution Role'
  },
  {
    id: 'AwsSolutions-L1',
    reason: 'All Lambdas set to use NODEJS_LATEST'
  }
], true)

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  [
    '/RssAggregatorStackAppStack/rssAggregatorDatabase/rssAggregatorInitiateFunction/ServiceRole/DefaultPolicy/Resource',
    '/RssAggregatorStackAppStack/rssAggregatorDatabase/rssAggregatorInitiateTopicsFunction/ServiceRole/DefaultPolicy/Resource',
    '/RssAggregatorStackAppStack/rssAggregatorCognito/rssAggregatorInitiateFunction/ServiceRole/DefaultPolicy/Resource',
    '/RssAggregatorStackAppStack/rssAggregatorApi/rssAggregatorApi/ServiceRole/DefaultPolicy/Resource',
    '/RssAggregatorStackAppStack/rssAggregatorEvents/rssAggreagtorsEventParser/ServiceRole/DefaultPolicy/Resource',
    '/RssAggregatorStackAppStack/rssAggregatorCognito/rssAggregatorGuestCreationFunction/ServiceRole/DefaultPolicy/Resource',
    '/RssAggregatorStackAppStack/rssAggregatorDatabase/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/DefaultPolicy/Resource',
    '/RssAggregatorStackAppStack/rssAggregatorCognito/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/DefaultPolicy/Resource'
  ],
  [
    {
      id: 'AwsSolutions-IAM5',
      reason: 'Default XRay Policy Added by CDK Construct.'
    }
  ]
)

cdk.Aspects.of(app).add(new AwsSolutionsChecks())
