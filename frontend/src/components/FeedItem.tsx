import React, { useState } from 'react'
import './FeedList.css'
import { Feed } from '../networking/useGetFeeds'
import { deleteFeed as deleteFeedById, updateFeed } from '../networking/feeds'
import  CheckIcon from '../assets/check.svg?react';

export interface FeedItemProps {
  feed: Feed
  feeds: Feed[]
  setFeeds: (feed: Feed[]) => void

  selectedFeed: Feed
  setSelectedFeed: (feed: Feed) => void

  editingId: string | null
  setEditing: (editId: string | null) => void
}

function FeedItem (props: FeedItemProps) {
  const [hovering, setHovering] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const isEditing = props.editingId === props.feed.id
  const setEdit = (editFlag: boolean) => {
    if (editFlag) {
      props.setEditing(props.feed.id)
    } else {
      props.setEditing(null)
    }
  }

  return (
    <li
      onClick={() => props.setSelectedFeed(props.feed)}
      onMouseEnter={() => setHovering(true && props.feed.id !== '0')}
      onMouseLeave={() => setHovering(false)}
      className={props.feed.id === props.selectedFeed.id ? 'selected' : ''}
      key={props.feed.id}
    >
      {!isEditing ? (
        <FeedItemContent
          feed={props.feed}
          feeds={props.feeds}
          setFeeds={props.setFeeds}
          selectedFeed={props.selectedFeed}
          setSelectedFeed={props.setSelectedFeed}
          editingId={props.editingId}
          setEditing={props.setEditing}
          hovering={hovering}
          setIsEditing={setEdit}
          isEditing={isEditing}
          setShowMenu={setShowMenu}
          showMenu={showMenu}
        />
      ) : (
        <FeedItemEdit
          feed={props.feed}
          feeds={props.feeds}
          setFeeds={props.setFeeds}
          selectedFeed={props.selectedFeed}
          setSelectedFeed={props.setSelectedFeed}
          editingId={props.editingId}
          setEditing={props.setEditing}
          hovering={hovering}
          setIsEditing={setEdit}
          isEditing={isEditing}
          setShowMenu={setShowMenu}
          showMenu={showMenu}
        />
      )}
    </li>
  )
}

type FeedItemContentProps = FeedItemProps & {
  hovering: boolean

  setIsEditing: (flag: boolean) => void
  isEditing: boolean

  setShowMenu: (flag: boolean) => void
  showMenu: boolean
}

function FeedItemContent (props: FeedItemContentProps) {
  const onEditClick = async (evt: any) => {
    evt.preventDefault()
    evt.stopPropagation()

    props.setShowMenu(!props.showMenu)
  }

  const deleteFeed = async (evt: any) => {
    evt.preventDefault()
    evt.stopPropagation()

    await deleteFeedById(props.feed.id).then(it => {
      if (it) {
        const newFeedList = props.feeds.filter(it => it.id !== props.feed.id)
        props.setFeeds(newFeedList)
      }
    })

    props.setShowMenu(false)
  }

  const editFeed = (evt: any) => {
    evt.preventDefault()
    evt.stopPropagation()

    props.setIsEditing(true)
    props.setShowMenu(false)
  }

  return (
    <div className='listItemContent'>
      <div className='feedName'>{props.feed.title}</div>
      {(props.hovering || props.showMenu) && (
        <div className='editDots' onClick={onEditClick}>
          ...
        </div>
      )}

      {props.showMenu && (
        <>
          <div className='editMenu'>
            <div className='editMenuItem' onClick={editFeed}>
              Edit
            </div>
            <div className='editMenuItem' onClick={deleteFeed}>
              Delete
            </div>
          </div>
          <div
            className='editWrapper'
            onClick={evt => {
              evt.stopPropagation()
              props.setShowMenu(false)
            }}
          />
        </>
      )}
    </div>
  )
}

function FeedItemEdit (props: FeedItemContentProps) {
  const [feedName, setFeedName] = useState(props.feed.title)

  const submit = async (evt: any) => {
    evt.preventDefault()
    evt.stopPropagation()

    const updatedFeed = { ...props.feed, title: feedName }
    await updateFeed(props.feed, updatedFeed)

    const indexOfFeed = props.feeds.findIndex(val => val.id === props.feed.id)
    const updatedFeeds = [...props.feeds]
    updatedFeeds[indexOfFeed] = updatedFeed
    props.setFeeds(updatedFeeds)

    // then close the menu
    props.setIsEditing(false)
  }

  const cancel = (evt: any) => {
    evt.preventDefault()
    evt.stopPropagation()
    // Delete from the backend.

    // then close the menu
    props.setIsEditing(false)
  }

  return (
    <div className='listItemContentEditing'>
      <div className='editFeedPosition'>
        <div className='upArrow'></div>
        <div className='downArrow'></div>
      </div>
      <div className='editFeedName'>
        <input
          value={feedName}
          onClick={e => e.stopPropagation()}
          onChange={e => setFeedName(e.target.value)}
        />
      </div>
      <div className='editItems'>
        <div className='cancelEdit' onClick={cancel}>
          x
        </div>
        <div className='submitEdit' onClick={submit}>
          <CheckIcon width={14} height={14}/>
        </div>
      </div>
    </div>
  )
}

export default FeedItem
