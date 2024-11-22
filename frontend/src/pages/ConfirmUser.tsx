import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { confirmSignUp } from '../networking/auth'
import './ConfirmUser.css'

const ConfirmUser = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState<string>(location.state?.email || '')
  const [confirmationCode, setConfirmationCode] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      await confirmSignUp(email.toLowerCase(), confirmationCode)
      navigate('/login')
    } catch (error) {
      alert(`Failed to confirm account: ${error}`)
    }
  }

  return (
    <div className='confirmForm'>
      <div className='form'>
        <div id='Logo'>
          <span>RSS</span>Aggregator
        </div>
        <h4>A Verification Code has been sent to your e-mail</h4>
        <form onSubmit={handleSubmit}>
          <div>
            <input
              className='inputText'
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='Email'
              required
            />

            <input
              className='inputText'
              id='verCode'
              value={confirmationCode}
              onChange={e => setConfirmationCode(e.target.value)}
              placeholder='Verification Code'
              required
            />
          </div>

          <button type='submit'>Verify Email</button>
        </form>
      </div>
    </div>
  )
}

export default ConfirmUser
