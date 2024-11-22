import React from 'react'
import './Item.css'
import { FeedItem } from '../networking/useGetFeedItems'
import { getTimeAgo } from '../utils/date'

export interface ItemProps {
  item: FeedItem
}

function Item ({ item }: ItemProps) {
  const colorSet = ['EF9C66', 'FCDC94', 'C8CFA0', '78ABA8']

  const randomBackgroundColor = (title: string): string => {
    const num = title
      .split('')
      .reduce<number>((prev, curr) => prev + curr.charCodeAt(0), 0)
    return `#${colorSet[num % colorSet.length]}`
  }

  return (
    <div className='feedItem'>
      <a href={item.url} target='_blank' rel='noreferrer'>
        <div className='content'>
          <h2>{item.title}</h2>
          <section>{item.description}</section>

          <div className='bottomBar'>
            <div className='published'>{getTimeAgo(item.published)}</div>
            <div className='info'>
              <div className='feed'>{item.feedname}</div>
              <div className='author'>{item.author}</div>
            </div>
          </div>
        </div>

        {(item.image && <img alt={item.title} src={item.image} />) || (
          <div
            className='alternateItemImage'
            style={{ backgroundColor: randomBackgroundColor(item.title) }}
          >
            {item.title.charAt(0)}
          </div>
        )}
      </a>
    </div>
  )
}

export default Item
