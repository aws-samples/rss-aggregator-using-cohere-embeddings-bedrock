import { useState } from 'react'
import './TopicChooser.css'

export interface SearchBarProps {
  closeSearch: () => void
  onSearch: (searchTerm: string) => void
  searchTerm: string | null
  setSearchTerm: (term: string | null) => void
}

function SearchBar (props: SearchBarProps) {
  const [searchInput, setSearchInput] = useState<string>('')

  const onSubmit = (evt: any) => {
    console.log(evt.key)
    if (evt.key === 'Enter') {
      props.onSearch(searchInput)
      setSearchInput('')
    }
  }


  return (
    <div id='SearchBar'>
      <input
        id='SearchInput'
        disabled={!!props.searchTerm}
        value={!!props.searchTerm ? '' : searchInput}
        onChange={evt => setSearchInput(evt.target.value)}
        onKeyUp={onSubmit}
      ></input>
      {props.searchTerm && <span id='SearchTerm'>{props.searchTerm} </span>}
      {props.searchTerm && (
        <div id='SearchClose' onClick={() => props.setSearchTerm(null)}>
          X
        </div>
      )}
    </div>
  )
}

export default SearchBar
