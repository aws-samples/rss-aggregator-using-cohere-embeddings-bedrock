import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import ItemContainer from '../components/ItemContainer'
import AddFeedModal from '../components/AddModalContainer'
import { Feed, useGetFeeds } from '../networking/useGetFeeds'
import { useGetTopics } from '../networking/useGetTopicTabs'
import { useGetFeedItems } from '../networking/useGetFeedItems'
import TopicModal from '../components/TopicModal'

function Home () {
  const {
    setTopic,
    activeTopic,
    activeFeed,
    setSelectedFeed,
    items,
    clearCache,
    page,
    setPage,
    hasMore,
    isLoading,
    searchTerm,
    setSearchTerm
  } = useGetFeedItems(
    { id: '686ed645-728a-4c9e-aec5-240c31af9b0d', name: 'All' },
    { id: '0', title: 'All Feeds', link: 'XXX' }
  )
  const [isFeedModalVisible, setIsFeedModalVisible] = useState(false)
  const [isTopicAddModalVisible, setIsTopicAddModalVisible] = useState(false)
  const [isTopicEditModalVisible, setIsTopicEditModalVisible] = useState(false)
  
  const { feeds, setFeeds } = useGetFeeds()
  const { topics, setTopics } = useGetTopics()

  const setFeedAndClearCache = (feeds: Feed[]) => {
    setFeeds(feeds)
    clearCache()
  }

  return (
    <div className='App'>
      {isFeedModalVisible && (
        <AddFeedModal
          modalVisible={isFeedModalVisible}
          setModalVisible={setIsFeedModalVisible}
          feeds={feeds}
          setFeeds={setFeedAndClearCache}
        />
      )}

      <TopicModal
        setAddModalVisible={setIsTopicAddModalVisible}
        addModalVisible={isTopicAddModalVisible}
        setEditModalVisible={setIsTopicEditModalVisible}
        editModalVisible={isTopicEditModalVisible}
        topics={topics}
        setTopics={setTopics}
      />

      <Sidebar
        setFeeds={setFeedAndClearCache}
        selectedFeed={activeFeed}
        setSelectedFeed={setSelectedFeed}
        feeds={feeds}
        modalVisible={isFeedModalVisible}
        setModalVisible={setIsFeedModalVisible}
      />

      <ItemContainer
        items={items ?? []}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        page={page}
        setPage={setPage}
        hasMore={hasMore}
        topics={topics}
        selectedTopic={activeTopic}
        setSelectedTopic={setTopic}
        isLoading={isLoading}
        setIsTopicAddModalVisible={setIsTopicAddModalVisible}
        setIsTopicEditModalVisible={setIsTopicEditModalVisible}
      />
    </div>
  )
}

export default Home
