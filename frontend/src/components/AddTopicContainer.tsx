import React, { ChangeEvent, FormEvent, useState } from 'react'
import './AddTopic.css'
import { Topic } from '../networking/useGetTopicTabs'
import { addTopic } from '../networking/topic'
import { isDemoUser } from '../networking/auth'

export interface AddTopicModalProps {
  modalVisible: boolean
  setModalVisible: (visible: boolean) => void

  topics: Topic[]
  setTopics: (topic: Topic[]) => void
}

function AddTopicModal (props: AddTopicModalProps) {
  const [topicName, setTopicName] = useState('')
  const [topicExamples, setTopicExamples] = useState<string[]>([''])

  const toggleModal = () => {
    props.setModalVisible(!props.modalVisible)
  }

  const setTopicIndex = (idx: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const replacement = [...topicExamples]
    replacement[idx] = e.target.value

    setTopicExamples(replacement)
  }

  const removeExample = (idx: number) => (evt: any) => {
    const replacement = [...topicExamples]
    replacement.splice(idx, 1)

    setTopicExamples(replacement.length === 0 ? [''] : replacement)
  }

  const createTopic = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault()
    const { topic } = await addTopic({
      name: topicName,
      related: topicExamples
    })

    props.setTopics([...props.topics, topic])
    setTopicExamples([])
    setTopicName('')
    props.setModalVisible(false)
  }

  const isSubmittable =
    topicName && topicName !== '' && !topicExamples.some(it => it === '')

  return (
    <div
      id='AddTopicContainer'
      data-add-feed={props.modalVisible}
      onClick={toggleModal}
    >
      <div id='AddTopic' onClick={evt => evt.stopPropagation()}>
        <h2>Add Topic</h2>
        { !isDemoUser() && (<form onSubmit={createTopic}>
          <div className='inputs'>
            <h3> Topic Name: </h3>
           <input
              id='topicName'
              className='inputText'
              placeholder='Topic Name'
              value={topicName}
              onChange={e => setTopicName(e.target.value)}
              required
            />
            <h4>
              In order to approve the accuracy of these Topics, it is
              recommended to add related topics.
            </h4>
            <div>
              <h3>Related:</h3>
              <div
                id='AddTopicButton'
                onClick={() => setTopicExamples([...topicExamples, ''])}
              >
                +
              </div>
            </div>
            <div className='topicExamples'>
              {topicExamples.map((it, idx) => {
                return (
                  <div className='topicExample'>
                    <input
                      className='inputText'
                      placeholder='Topic'
                      value={it}
                      onChange={setTopicIndex(idx)}
                      required
                    />
                    <div className='removeExample' onClick={removeExample(idx)}>
                      -
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className='buttons'>
            <button className='cancel' onClick={toggleModal}>
              Cancel
            </button>
            <button type='submit' disabled={!isSubmittable}>
              Submit
            </button>
          </div>
        </form>) || (<h2>Demo users cannot add Topics. Sign up to see functionality</h2>)}
      </div>
    </div>
  )
}

export default AddTopicModal
