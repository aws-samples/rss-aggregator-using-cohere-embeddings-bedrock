import {
  CdkCustomResourceResponse,
  CloudFormationCustomResourceEvent,
  Context
} from 'aws-lambda'
import { AdminAddUserToGroupCommand, CognitoIdentityProviderClient, CreateGroupCommand, CreateGroupCommandOutput, GroupType, ListDevicesCommand, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider";

export const cognitoClient = new CognitoIdentityProviderClient();

const createDemoUser = async (group: GroupType) => { 
    const params = {
      ClientId: process.env['CLIENT_ID'],
      Username: process.env['USERNAME']?.toLowerCase(),
      Password: process.env['PASSWORD'],
      UserAttributes: [
        {
          Name: 'email',
          Value: process.env['USERNAME']?.toLowerCase()
        }
      ]
    }
    try {
      const command = new SignUpCommand(params)
      const response = await cognitoClient.send(command)

      // Now we need to add group 
      const addUserToGroupCommand = new AdminAddUserToGroupCommand({ 
        GroupName: group.GroupName!,
        Username: process.env['USERNAME']?.toLowerCase(),
        UserPoolId: process.env['USER_POOL_ID'],
      });
      await cognitoClient.send(addUserToGroupCommand)

      console.log('Sign up success: ', response)
      return response
    } catch (error) {
      console.error('Error signing up: ', error)
      throw error
    }
  }

const createDemoGroup = async(): Promise<GroupType>  => { 
  const createDemoGroupParams = new CreateGroupCommand({
    GroupName: 'demo-user', 
    UserPoolId: process.env['USER_POOL_ID'],
    Description: 'The demo user account to prevent random writes on the guest account. '
  })

  const cognitoResponse = await cognitoClient.send(createDemoGroupParams)
  return cognitoResponse.Group!!
}

export const handler = async (
  event: CloudFormationCustomResourceEvent,
  context: Context
): Promise<CdkCustomResourceResponse> => {
  const resp: CdkCustomResourceResponse = {
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    PhysicalResourceId: context.logGroupName
  }


  switch (event.RequestType) {
    case 'Create':
      const group = await createDemoGroup();
      const user = await createDemoUser(group); 
      return {
        ...resp,
        Status: 'SUCCESS',
        Data: { Result: user }
      }

    case 'Update':
    case 'Delete':
     return {
        ...resp,
        Status: 'SUCCESS',
        Data: { Result: {} }
      }
  }
}

 