import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommandInput
} from '@aws-sdk/client-cognito-identity-provider'
import { config } from '../utils/config'
import { jwtDecode } from 'jwt-decode';

export const cognitoClient = new CognitoIdentityProviderClient({
  region: config.region
})

export const signIn = async (username: string, password: string) => {
  const params: InitiateAuthCommandInput = {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: config.clientId,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password
    }
  }
  try {
    const command = new InitiateAuthCommand(params)
    const { AuthenticationResult } = await cognitoClient.send(command)
    if (AuthenticationResult) {
      localStorage.setItem('idToken', AuthenticationResult.IdToken || '')
      localStorage.setItem(
        'accessToken',
        AuthenticationResult.AccessToken || ''
      )
      localStorage.setItem(
        'refreshToken',
        AuthenticationResult.RefreshToken || ''
      )
      localStorage.setItem(
        'expiryDate',
        Number(
          Date.now() + (AuthenticationResult.ExpiresIn || 0) * 1000
        ).toString()
      )
      return AuthenticationResult
    }
  } catch (error) {
    console.error('Error signing in: ', error)
    throw error
  }
}

export const refreshToken = async () => {
  const refresh = localStorage.getItem('refreshToken')

  if (!refresh) {
    throw Error('No Refresh Token found, not authenticated')
  }

  const params: InitiateAuthCommandInput = {
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    // @ts-ignore (Find better mechanism for this)
    ClientId: CONFIG.clientId,
    AuthParameters: {
      REFRESH_TOKEN: localStorage.getItem('refreshToken')!
    }
  }
  try {
    const command = new InitiateAuthCommand(params)
    const { AuthenticationResult } = await cognitoClient.send(command)
    if (AuthenticationResult) {
      localStorage.setItem('idToken', AuthenticationResult.IdToken || '')
      localStorage.setItem(
        'accessToken',
        AuthenticationResult.AccessToken || ''
      )
      localStorage.setItem(
        'refreshToken',
        AuthenticationResult.RefreshToken || refresh
      )
      localStorage.setItem(
        'expiryDate',
        Number(
          Date.now() + (AuthenticationResult.ExpiresIn || 0) * 1000
        ).toString()
      )
      return AuthenticationResult
    }
  } catch (error) {
    console.error('Error Refreshing Token ', error)
    throw error
  }
}

export const signUp = async (email: string, password: string) => {
  const params = {
    // @ts-ignore (Find better mechanism for this)
    ClientId: CONFIG.clientId,
    Username: email,
    Password: password,
    UserAttributes: [
      {
        Name: 'email',
        Value: email
      }
    ]
  }
  try {
    const command = new SignUpCommand(params)
    const response = await cognitoClient.send(command)
    console.log('Sign up success: ', response)
    return response
  } catch (error) {
    console.error('Error signing up: ', error)
    throw error
  }
}

export const confirmSignUp = async (username: string, code: string) => {
  const params = {
    ClientId: config.clientId,
    Username: username,
    ConfirmationCode: code
  }
  try {
    const command = new ConfirmSignUpCommand(params)
    await cognitoClient.send(command)
    console.log('User confirmed successfully')
    return true
  } catch (error) {
    console.error('Error confirming sign up: ', error)
    throw error
  }
}

export const isDemoUser = (): boolean => {
  const user = localStorage.getItem('accessToken');
  if (user) { 
    const decodedUser = jwtDecode<{ 'cognito:groups': string[] }>(user)
    return decodedUser['cognito:groups'] ? decodedUser['cognito:groups']?.indexOf('demo-user') > -1 : false; 
  }
  return false; 
 }


export const logout = (): boolean => {
  localStorage.removeItem('idToken');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('expiryDate');

  return true;
 }
