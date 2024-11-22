import React, { useEffect, useState } from 'react'
import './AddFeed.css'
import { addFeed, checkFeedValidty } from '../networking/feeds'
import { Feed } from '../networking/useGetFeeds'
import { isDemoUser } from '../networking/auth'

export interface AddFeedModalProps {
  modalVisible: boolean
  setModalVisible: (visible: boolean) => void

  feeds: Feed[]
  setFeeds: (feed: Feed[]) => void
}

function AddFeedModal (props: AddFeedModalProps) {
  const [isValidUrl, setIsValidUrl] = useState(false)
  const [feedName, setFeedName] = useState('')
  const [feedUrl, setFeedUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const toggleModal = () => {
    props.setModalVisible(!props.modalVisible)
  }

  const isActualUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch (error) {
      return false
    }
  }

  const submitFeed = (evt: any) => {
    evt.preventDefault()
    addFeed(feedUrl, feedName).then(data => {
      props.setFeeds([...props.feeds, data.feed])
      toggleModal()
    })
  }

  const isValidEntry = isValidUrl && !!feedName

  useEffect(() => {
    setIsValidUrl(false)
    const timeout = setTimeout(() => {
      if (!isActualUrl(feedUrl)) {
        console.log('Invalid URL')
        return
      }

      setIsLoading(true)
      checkFeedValidty(feedUrl)
        .then(it => {
          setIsLoading(false)
          setIsValidUrl(it.isValid)
          if (it.isValid) {
            setFeedName(it.name!)
          }
        })
        .catch(e => setIsLoading(false))
    }, 500)

    return () => clearTimeout(timeout)
  }, [feedUrl])

  return (
    <div
      id='AddModalContainer'
      data-add-feed={props.modalVisible}
      onClick={toggleModal}
    >
      <div id='AddModal' onClick={evt => evt.stopPropagation()}>
        <h2>Add Feed</h2>
        { !isDemoUser() && 
        (<form onSubmit={submitFeed}>
          <div className='inputs'>
            <h3> Feed Url: </h3>
            <input
              id='feedUrl'
              className='inputText'
              placeholder='Feed Url'
              value={feedUrl}
              onChange={e => setFeedUrl(e.target.value)}
              required
            />

            <h3> Feed Name: </h3>
            <input
              id='feedName'
              className='inputText'
              placeholder='Feed Name'
              value={feedName}
              onChange={e => setFeedName(e.target.value)}
              required
            />
            {isLoading && <span className='loader'></span>}
          </div>

          <div className='buttons'>
            <button className='cancel' onClick={toggleModal}>
              Cancel
            </button>
            <button disabled={!isValidEntry} type='submit'>
              Submit
            </button>
          </div>
        </form>) || (<h2>Demo users cannot add Feeds. Sign up to see functionality</h2>)}
      </div>
    </div>
  )
}

export default AddFeedModal
