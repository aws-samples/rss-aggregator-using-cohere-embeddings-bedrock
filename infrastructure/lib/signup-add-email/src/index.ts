import {
  PreSignUpTriggerEvent,
  PreSignUpTriggerHandler,
  Context
} from 'aws-lambda'
import { Client } from 'pg'
import * as rds from '@aws-sdk/rds-signer'
import * as fs from 'fs';

const client = (async (): Promise<Client> => {
  const signer = new rds.Signer({
    port: 5432,
    username: process.env['DB_USERNAME']!,
    hostname: process.env['DB_HOST']!
  })

  const client = new Client({
    port: 5432,
    host: process.env['DB_HOST'],
    user: process.env['DB_USERNAME']!,
    password: await signer.getAuthToken(),
    database: process.env['DB_NAME']!,
    ssl: process.env.USES_PROXY === "true" ? true : {
      requestCert: true, 
      ca: fs.readFileSync("global-bundle.pem")

    },
    connectionTimeoutMillis: 20000,
  })
  await client.connect()
  return client
})()

export const handler: PreSignUpTriggerHandler = async (
  event: PreSignUpTriggerEvent,
  context: Context
): Promise<PreSignUpTriggerEvent> => {
  const userId = event.userName;
  const email = event.request.userAttributes['email'];

  // Add Account to Database. 
  await (client.then(it => it.query(`INSERT into users(id, email) VALUES($1, $2)`, [userId, email])));

  // Verify the Cognito Account 
  event.response.autoConfirmUser = true; 
  event.response.autoVerifyEmail = true; 

  return event; 
}
