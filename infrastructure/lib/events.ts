import { UserPool } from 'aws-cdk-lib/aws-cognito'
import { IVpc, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2'
import {
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal
} from 'aws-cdk-lib/aws-iam'
import { CfnSchedule } from 'aws-cdk-lib/aws-scheduler'
import { Queue } from 'aws-cdk-lib/aws-sqs'
import { Construct } from 'constructs'
import { EventBus, Rule } from 'aws-cdk-lib/aws-events'
import { SqsQueue } from 'aws-cdk-lib/aws-events-targets'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Duration, NestedStack } from 'aws-cdk-lib'
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda'
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources'
import { DatabaseConnectable } from './database'
import path = require('path')

export class Events extends NestedStack {
  public api: Queue
  public eventBus: EventBus

  constructor (
    scope: Construct,
    id: string,
    props: {
      vpc: IVpc
      dbConnection: DatabaseConnectable
      sg: SecurityGroup
      cognito: UserPool
    }
  ) {
    super(scope, id)

    const dlq = new Queue(this, 'parsingDlq', { enforceSSL: true, fifo: true })
    const sqsQueue = new Queue(this, 'parsingQueue', {
      fifo: true,
      visibilityTimeout: Duration.seconds(900),
      contentBasedDeduplication: true,
      enforceSSL: true,
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 5
      }
    })

    const eventBus = new EventBus(this, 'rssAggreagtorBus', {
      eventBusName: 'rssAggreagtorBus'
    })
    this.eventBus = eventBus

    this.setUpHourlyRefresh(sqsQueue)
    this.setupForwarderToSqs(sqsQueue, eventBus)
    this.setupLambdaHandler(sqsQueue, props.vpc, props.sg, props.dbConnection)
  }

  setupLambdaHandler (
    sqsQueue: Queue,
    vpc: IVpc,
    sg: SecurityGroup,
    dbConnection: DatabaseConnectable
  ) {
    const eventLambda = new NodejsFunction(this, 'rssAggreagtorsEventParser', {
      timeout: Duration.seconds(900),
      runtime: Runtime.NODEJS_LATEST,
      entry: '../retrieval/src/index.ts',
      depsLockFilePath: '../retrieval/package-lock.json',
      environment: {
        PG_HOST: dbConnection.endpoint,
        PG_PORT: '5432',
        PG_USER: 'rssAggregator',
        PG_DB: 'rssAggregator',
        USES_PROXY: dbConnection.isProxy.toString()
      },

      tracing: Tracing.ACTIVE,
      memorySize: 1024,
      vpc,
      bundling: {
        nodeModules: ['jsdom', 'pg-format'],
        commandHooks: {
          beforeBundling (inputDir: string, outputDir: string): string[] {
            return [
              `cp -r "${path.join(
                __dirname,
                '../resources/global-bundle.pem'
              )}" "${outputDir}"`
            ]
          },
          afterBundling (inputDir: string, outputDir: string): string[] {
            return []
          },
          beforeInstall (inputDir: string, outputDir: string): string[] {
            return []
          }
        }
      },

      securityGroups: [sg],
      handler: 'handler',
      vpcSubnets: vpc.selectSubnets({
        subnetType: SubnetType.PRIVATE_WITH_EGRESS
      })
    })

    eventLambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream'
        ],
        resources: [
          `arn:aws:bedrock:${process.env.CDK_DEFAULT_REGION}::foundation-model/cohere.embed-english-v3`
        ]
      })
    )

    dbConnection.grantConnect(eventLambda)

    // We handle it one at a time as we have set up a method to keep within rate limits.
    eventLambda.addEventSource(
      new SqsEventSource(sqsQueue, {
        batchSize: 1
      })
    )
  }

  setupForwarderToSqs (sqsQueue: Queue, eventBus: EventBus) {
    const rule = new Rule(this, 'sqsRule', {
      eventBus
    })

    rule.addEventPattern({
      source: ['rssAggregator'],
      detailType: ['queueMessage']
    })

    rule.addTarget(
      new SqsQueue(sqsQueue, {
        messageGroupId: 'discoverMessage'
      })
    )
  }

  setUpHourlyRefresh (sqsQueue: Queue) {
    const schedulerRole = new Role(this, 'hourScheduler', {
      assumedBy: new ServicePrincipal('scheduler.amazonaws.com')
    })

    const schedulerPolicy = new PolicyStatement({
      actions: ['sqs:SendMessage'],
      resources: [sqsQueue.queueArn],
      effect: Effect.ALLOW
    })

    schedulerRole.addToPolicy(schedulerPolicy)

    const hourSchedule = new CfnSchedule(this, 'hourlySchedule', {
      flexibleTimeWindow: { mode: 'OFF' },
      scheduleExpression: 'rate(1 hours)',
      target: {
        arn: sqsQueue.queueArn,
        roleArn: schedulerRole.roleArn,
        input: JSON.stringify({ eventType: 'REFRESH' }),
        sqsParameters: {
          messageGroupId: 'discoverMessage'
        }
      }
    })

    sqsQueue.addToResourcePolicy(
      new PolicyStatement({
        actions: [
          'sqs:SendMessage',
          'sqs:GetQueueUrl',
          'sqs:GetQueueAttributes'
        ],
        principals: [new ServicePrincipal('scheduler.amazonaws.com')],
        resources: [sqsQueue.queueArn],
        effect: Effect.ALLOW
      })
    )
  }
}
