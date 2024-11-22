import React from 'react'
import './EditTopic.css'
import { Topic } from '../networking/useGetTopicTabs'
import HiddenIcon from '../assets/eye-off.svg?react'
import HideIcon from '../assets/eye.svg?react'
import  TrashIcon from '../assets/trash-icon.svg?react'
import { deleteTopic, hideTopic } from '../networking/topic'

export interface EditTopicModalProps {
  modalVisible: boolean
  setModalVisible: (visible: boolean) => void

  topics: Topic[]
  setTopics: (topic: Topic[]) => void
}

function EditTopicModal (props: EditTopicModalProps) {
  const toggleModal = () => {
    props.setModalVisible(!props.modalVisible)
  }

  const toggleHidden = (id: string, status: boolean) => async () => {
    await hideTopic(id, status)
    const idx = props.topics.findIndex(it => it.id === id)
    const replace = [...props.topics]
    replace[idx].hidden = status

    props.setTopics(replace)
  }

  const deleteTopicId = (id: string) => async () => {
    const idx = props.topics.findIndex(it => it.id === id)
    await deleteTopic(id)

    const replace = [...props.topics]
    replace.splice(idx, 1)
    props.setTopics(replace)
  }

  return (
    <div id='EditTopicContainer' onClick={toggleModal}>
      <div id='EditTopic' onClick={evt => evt.stopPropagation()}>
        <h2>Edit Topics</h2>
        <div id='TopicsContainer'>
          {props.topics.map(it => {
            return (
              <div className='editTopic'>
                <div>{it.name}</div>
                <div className='editTopicButtons'>
                  <div
                    className='editTopicHide'
                    onClick={toggleHidden(it.id, !it.hidden)}
                  >
                    {it.hidden ? <HiddenIcon /> : <HideIcon />}
                  </div>
                  {it.deletable && (
                    <div
                      className='editTopicDelete'
                      onClick={deleteTopicId(it.id)}
                    >
                      <TrashIcon />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div className='buttons'>
          <button className='cancel' onClick={toggleModal}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditTopicModal
