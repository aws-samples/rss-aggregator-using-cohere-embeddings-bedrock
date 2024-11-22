import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, signUp } from '../networking/auth'
import './LoginPage.css'

const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false)

  return !isSignUp ? (
    <LoginForm setIsSignUp={setIsSignUp}></LoginForm>
  ) : (
    <SignUpForm setIsSignUp={setIsSignUp}></SignUpForm>
  )
}

const LoginForm = (props: { setIsSignUp: (isSignUp: boolean) => void }) => {
  const GUEST_LOGIN = 'RssAggregatorDemoUser@rssaggregatorsample.com'.toLowerCase();
  const GUEST_PASSWORD = 'RssAggregatorDemoUser123!';

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSignIn = async (email: string, password: string) => { 
    try { 
      const session = await signIn(email.toLowerCase(), password)
      console.log('Sign in successful', session)
      if (session && typeof session.AccessToken !== 'undefined') {
        localStorage.setItem('accessToken', session.AccessToken)
        if (localStorage.getItem('accessToken')) {
          window.location.href = '/home'
        } else {
          console.error('Session token was not set properly.')
        }
      } else {
        console.error('SignIn session or AccessToken is undefined.')
      }
    } catch (error) {
      alert(`Sign in failed: ${error}`)
    }
  }

  const handleSignInSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    await handleSignIn(email.toLowerCase(), password)
  }

  const handleGuestSignIn = async () => { 
    await handleSignIn(GUEST_LOGIN, GUEST_PASSWORD);
  }

  return (
    <div className='loginForm'>
      <div className='form'>
        <div id='Logo'>
          <span>RSS</span>Aggregator
        </div>
        <h4>Login to your Account</h4>
        <form onSubmit={handleSignInSubmit}>
          <div>
            <input
              className='inputText'
              id='email'
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='Email'
              required
            />
          </div>
          <div>
            <input
              className='inputText'
              id='password'
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder='Password'
              required
            />
          </div>

          <button type='submit'>Sign In</button>
          <button className='guestButton' onClick={() => handleGuestSignIn()}>View as Guest</button>

          <a href='#todo'>Forgot your password?</a>
        </form>
      </div>
      <div className='sidebar'>
        <h4>
          Need an
          <br />
          Account?
        </h4>
        <button onClick={() => props.setIsSignUp(true)}>Sign Up</button>
      </div>
    </div>
  )
}

const SignUpForm = (props: { setIsSignUp: (isSignUp: boolean) => void }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const navigate = useNavigate()

  const handleSignUp = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      alert('Passwords do not match')
      return
    }
    try {
      await signUp(email.toLowerCase(), password)
      const session = await signIn(email.toLowerCase(), password)
      console.log('Sign in successful', session)
      if (session && typeof session.AccessToken !== 'undefined') {
        localStorage.setItem('accessToken', session.AccessToken)
        if (localStorage.getItem('accessToken')) {
          navigate('/home')
        } else {
          console.error('Session token was not set properly.')
        }
      } else {
        console.error('SignIn session or AccessToken is undefined.')
      }
    } catch (error) {
      alert(`Sign up failed: ${error}`)
    }
  }

  return (
    <div className='loginForm'>
      <div className='form'>
        <div id='Logo'>
          <span>RSS</span>Aggregator
        </div>
        <h4>Login to your Account</h4>
        <form onSubmit={handleSignUp}>
          <div>
            <input
              className='inputText'
              id='email'
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='Email'
              required
            />
          </div>
          <div>
            <input
              className='inputText'
              id='password'
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder='Password'
              required
            />
          </div>

          <div>
            <input
              className='inputText'
              id='confirmPassword'
              type='password'
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder='Confirm Password'
              required
            />
          </div>
          <button type='submit'>Sign Up</button>
        </form>
      </div>
      <div className='sidebar'>
        <h4>
          Have an
          <br />
          Account?
        </h4>
        <button onClick={() => props.setIsSignUp(false)}>Sign In</button>
      </div>
    </div>
  )
}

export default LoginPage
