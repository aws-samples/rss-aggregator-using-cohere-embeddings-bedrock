import useSWR from 'swr'
import { authFetch } from '../utils/fetch'
import { config } from '../utils/config'
import { useState } from 'react'

type TopicResponse = {
  error: any
  isLoading: boolean
  isValidating: boolean
  topics: Topic[]
  setTopics: (topics: Topic[]) => void
  revalidate: () => void
}

export type Topic = {
  id: string
  name: string
  deletable?: boolean
  hidden?: boolean
}

export function useGetTopics (): TopicResponse {
  const [topics, setTopics] = useState<Topic[]>([])

  const getTopics = async () => {
    return authFetch(`${config.apiEndpoint}/topics`)
      .then(res => res.json())
      .then(data => {
        setTopics(data.topics as Topic[])
      })
      .catch(err => {
        console.log('err', err)
      })
  }

  const { data, error, mutate, isValidating } = useSWR('/api/topics', getTopics)

  return {
    error,
    setTopics,
    isLoading: !error && !data,
    isValidating,
    topics,
    revalidate: () => {
      mutate()
    }
  }
}
