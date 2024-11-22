import React, { useRef, useState } from 'react'
import './TopicChooser.css'
import { Topic } from '../networking/useGetTopicTabs'

export interface TopicChooserProps {
  topics: Topic[]

  selectedTopic: Topic
  setSelectedTopic: (topic: Topic) => void
  setIsTopicAddModalVisible: (flag: boolean) => void
  setIsTopicEditModalVisible: (flag: boolean) => void
}

function TopicBar (props: TopicChooserProps) {
  const ref = useRef<HTMLUListElement>(null)
  const menuRef = useRef<HTMLLIElement>(null)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [showMenu, setShowMenu] = useState(false)
  const isOverflow = true
  let scrollToken = useRef<NodeJS.Timer | null>(null)

  const onHover = (positionModifier: number) => () => {
    scrollToken.current = setInterval(() => {
      if (ref.current) {
        ref.current.scrollLeft += positionModifier
        setShowMenu(false)
      }
    })
  }

  const stopHover = () => {
    clearInterval(scrollToken.current as NodeJS.Timeout)
    scrollToken.current = null
  }

  const onMenuClick = () => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const parentDiv = menuRef.current.parentElement?.getBoundingClientRect()
      const y = rect.bottom + 17
      const x = rect.right - (parentDiv?.x ?? 0) - 49
      setMenuPosition({ x, y })
      setShowMenu(!showMenu)
    }
  }

  return (
    <>
      {showMenu && (
        <>
          <div
            className='topicMenuEdit'
            style={{ left: menuPosition.x, top: menuPosition.y }}
          >
            <div
              className='topicMenuEditItem'
              onClick={() => {
                props.setIsTopicAddModalVisible(true)
                setShowMenu(false)
              }}
            >
              Add
            </div>
            <div
              className='topicMenuEditItem'
              onClick={() => {
                props.setIsTopicEditModalVisible(true)
                setShowMenu(false)
              }}
            >
              Edit
            </div>
          </div>
          <div
            className='editWrapper'
            onClick={evt => {
              evt.stopPropagation()
              setShowMenu(false)
            }}
          />
        </>
      )}
      <div id='TopicBar'>
        {isOverflow && (
          <>
            <div className='arrowContainer right'>
              <div
                onMouseOver={onHover(+1)}
                onMouseLeave={stopHover}
                className='rightHidden'
              ></div>
            </div>
            <div className='arrowContainer left'>
              <div
                onMouseOver={onHover(-1)}
                onMouseLeave={stopHover}
                className='leftHidden'
              ></div>
            </div>
          </>
        )}
        <ul id='TopicContainer' ref={ref} data-is-overflow={isOverflow}>
          {(props.topics ?? [])
            .filter(topic => !topic.hidden)
            .map((topic, index) => (
              <li
                key={index}
                className={
                  props.selectedTopic.id === topic.id ? 'selected' : ''
                }
                onClick={() => props.setSelectedTopic(topic)}
              >
                {topic.name}
              </li>
            ))}
          <li className='topicMenu' ref={menuRef} onClick={onMenuClick}>
            <span>...</span>
          </li>
          <li className='topicSpace' ref={menuRef} onClick={onMenuClick}></li>
          <li className='topicSpace' ref={menuRef} onClick={onMenuClick}></li>
        </ul>
      </div>
    </>
  )
}

export default TopicBar
