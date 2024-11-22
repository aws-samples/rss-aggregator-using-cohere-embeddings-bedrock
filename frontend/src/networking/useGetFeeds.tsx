import useSWR from 'swr'
import { authFetch } from '../utils/fetch'
import { useState } from 'react'
import { config } from '../utils/config'

type FeedsResponse = {
  error: any
  isLoading: boolean
  isValidating: boolean
  feeds: Feed[]
  setFeeds: (feeds: Feed[]) => void
}

export type Feed = {
  id: string
  title: string
  link: string
  description?: string
  image?: string
}

export function useGetFeeds (): FeedsResponse {
  const [feeds, setFeeds] = useState<Feed[]>([])
  const getFeeds = async () => {
    return authFetch(`${config.apiEndpoint}/feeds`)
      .then(res => res.json())
      .then(data => {
        setFeeds([{ id: '0', title: 'All Feeds', link: '' }, ...data.feeds])
      })
      .catch(err => {
        console.log('err', err)
      })
  }

  const { error, mutate, isValidating, isLoading } = useSWR(
    '/api/feeds',
    getFeeds
  )

  return {
    error,
    isLoading,
    isValidating,
    feeds,
    setFeeds: (feeds: Feed[]) => {
      mutate()
      setFeeds(feeds)
    }
  }
}
