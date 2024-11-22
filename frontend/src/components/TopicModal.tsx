import React from 'react'
import './AddTopic.css'
import { Topic } from '../networking/useGetTopicTabs'
import AddTopicModal from './AddTopicContainer'
import EditTopicModal from './EditTopicModal'

export interface TopicModalProps {
  editModalVisible: boolean
  setEditModalVisible: (visible: boolean) => void

  addModalVisible: boolean
  setAddModalVisible: (visible: boolean) => void

  topics: Topic[]
  setTopics: (topic: Topic[]) => void
}

function TopicModal (props: TopicModalProps) {
  return (
    <>
    {props.addModalVisible && (
      <AddTopicModal
        modalVisible={props.addModalVisible}
        setModalVisible={props.setAddModalVisible}
        topics={props.topics}
        setTopics={props.setTopics}
      />
    )}

    {props.editModalVisible && (
      <EditTopicModal
        modalVisible={props.editModalVisible}
        setModalVisible={props.setEditModalVisible}
        topics={props.topics}
        setTopics={props.setTopics}
      />
    )}
    </>
  )
}

export default TopicModal
