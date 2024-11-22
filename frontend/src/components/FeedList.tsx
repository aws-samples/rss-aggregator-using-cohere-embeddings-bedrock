import React, { useState } from 'react'
import './FeedList.css'
import { Feed } from '../networking/useGetFeeds'
import FeedItem from './FeedItem'

export interface FeedListProps {
  feeds: Feed[]
  setFeeds: (feeds: Feed[]) => void

  selectedFeed: Feed
  setSelectedFeed: (feed: Feed) => void
}

function FeedList (props: FeedListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  return (
    <ul id='FeedList'>
      {props.feeds.map(feed => {
        return (
          <FeedItem
            key={feed.id}
            feed={feed}
            feeds={props.feeds}
            setFeeds={props.setFeeds}
            selectedFeed={props.selectedFeed}
            setSelectedFeed={props.setSelectedFeed}
            editingId={editingId}
            setEditing={setEditingId}
          />
        )
      })}
    </ul>
  )
}

export default FeedList
