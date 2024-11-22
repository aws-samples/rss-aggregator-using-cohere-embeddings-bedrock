import React, { useCallback, useEffect, useState } from 'react'
import './ItemContainer.css'
import TopicChooser from './TopicChooser'
import Item from './Item'
import { Topic } from '../networking/useGetTopicTabs'
import { FeedItem } from '../networking/useGetFeedItems'
import LoadingIcon  from '../assets/loader-icon.svg?react'

export interface ItemContainerProps {
  topics: Topic[]

  selectedTopic: Topic
  setSelectedTopic: (topic: Topic) => void

  items: FeedItem[]

  page: number
  setPage: (page: number) => void
  hasMore: boolean
  isLoading: boolean

  searchTerm: string | null
  setSearchTerm: (term: string | null) => void

  setIsTopicAddModalVisible: (flag: boolean) => void
  setIsTopicEditModalVisible: (flag: boolean) => void
}

function ItemContainer (props: ItemContainerProps) {
  const itemContainerRef = React.useRef<HTMLDivElement>(null)
  const [items, setItems] = useState(props.items)
  const [isSearching, setIsSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  const onSearch = (term: string) => {
    setIsSearching(true)
    props.setSearchTerm(term)
  }

  const toggleSearch = (toggle: boolean) => {
    if (!toggle) {
      setItems(props.items)
    }

    props.setSearchTerm(null)
    setShowSearch(toggle)
  }

  const handleScrolling = useCallback(() => {
    if (!props.hasMore || props.isLoading || isSearching) {
      return
    }

    if (itemContainerRef.current) {
      const visible =
        itemContainerRef.current!.clientHeight +
        itemContainerRef.current!.scrollTop
      const height = itemContainerRef!.current?.scrollHeight

      if (visible === height) {
        props.setPage(props.page + 1)
      }
    }
    setItems(props.items)
  }, [props, isSearching])

  useEffect(() => {
    // Check to begin, as we might not have all the possible items.
    handleScrolling()
    const current = itemContainerRef.current
    let resizeObserver: ResizeObserver | null = null
    if ('ResizeObserver' in window && itemContainerRef.current) {
      resizeObserver = new ResizeObserver(handleScrolling)
      resizeObserver.observe(itemContainerRef.current)
    }

    current?.addEventListener('scroll', handleScrolling)
    return () => {
      resizeObserver?.disconnect()
      current?.removeEventListener('scroll', handleScrolling)
    }
  }, [handleScrolling, props.hasMore, props.isLoading, props.items, items])

  useEffect(() => {
    setItems(props.items)
  }, [props.items, props.topics])

  return (
    <div id='ItemContainer' ref={itemContainerRef}>
      <TopicChooser
        onSearch={onSearch}
        setSearchTerm={props.setSearchTerm}
        searchTerm={props.searchTerm}
        setShowSearch={toggleSearch}
        showSearch={showSearch}
        topics={props.topics}
        selectedTopic={props.selectedTopic}
        setSelectedTopic={props.setSelectedTopic}
        setIsTopicAddModalVisible={props.setIsTopicAddModalVisible}
        setIsTopicEditModalVisible={props.setIsTopicEditModalVisible}
      />

      {props.isLoading && (
        <div id='LoadingScreen'>
          <span>
            <LoadingIcon id='LoadingIcon' width={75} />
          </span>
        </div>
      )}
      {items.map((item) => {
        return <Item key={item.id} item={item} />
      })}
    </div>
  )
}

export default ItemContainer
