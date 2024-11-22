import './TopicChooser.css'
import { Topic } from '../networking/useGetTopicTabs'
import SearchIcon from '../assets/search-icon.svg?react'
import HashTag from '../assets/hashtag-icon.svg?react'
import TopicBar from './TopicBar'
import SearchBar from './SearchBar'

export interface TopicChooserProps {
  topics: Topic[]

  selectedTopic: Topic
  setSelectedTopic: (topic: Topic) => void
  setIsTopicAddModalVisible: (flag: boolean) => void
  setIsTopicEditModalVisible: (flag: boolean) => void

  showSearch: boolean; 
  setShowSearch: (show: boolean) => void; 
  onSearch: (searchTerm: string) => void;
  setSearchTerm: (term: string | null) => void;
  searchTerm: string | null;
}

function TopicChooser (props: TopicChooserProps) {

  return (
    <div id='TopicChooser'>
      <div id='Search' onClick={() => props.setShowSearch(!props.showSearch)}>
        {(props.showSearch && <HashTag stroke={'white'} width={15} height={15} />) || (
          <SearchIcon stroke={'white'} width={15} height={15} />
        )}
      </div>

      {(props.showSearch && (
        <SearchBar setSearchTerm={props.setSearchTerm} onSearch={props.onSearch} searchTerm={props.searchTerm} closeSearch={() => {props.setShowSearch(false); props.setSearchTerm(null)}} />
      )) || <TopicBar {...props} />}
    </div>
  )
}

export default TopicChooser
