import React from 'react'
import './AddFeed.css'

export interface AddFeedProps {
  modalVisible: boolean
  setModalVisible: (visible: boolean) => void
}

function AddFeed (props: AddFeedProps) {
  function toggleModal () {
    props.setModalVisible(!props.modalVisible)
  }

  return (
    <div id='AddFeed'>
      <div id='AddButton' onClick={toggleModal}>
        +
      </div>
    </div>
  )
}

export default AddFeed
