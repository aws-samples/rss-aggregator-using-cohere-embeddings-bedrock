import React from 'react'
import './Sidebar.css'
import AddFeed from './AddFeed'
import FeedList from './FeedList'
import { Feed } from '../networking/useGetFeeds'
import { logout } from '../networking/auth'

export interface SidebarProps {
  modalVisible: boolean
  setModalVisible: (visible: boolean) => void

  feeds: Feed[]
  setFeeds: (feeds: Feed[]) => void

  selectedFeed: Feed
  setSelectedFeed: (feed: Feed) => void
}

function Sidebar (props: SidebarProps) {
  const logoutAndRedirect = () => { 
    logout();
    window.location.href = '/login'
  }

  return (
    <div id='Sidebar'>
      <div id='Logo'>
        <span>RSS</span>Aggregator
      </div>
      <AddFeed
        modalVisible={props.modalVisible}
        setModalVisible={props.setModalVisible}
      />
      <FeedList
        setFeeds={props.setFeeds}
        selectedFeed={props.selectedFeed}
        setSelectedFeed={props.setSelectedFeed}
        feeds={props.feeds}
      />
      <div id='Logout' onClick={logoutAndRedirect}>
        <a>logout</a>
      </div>
    </div>
  )
}

export default Sidebar
