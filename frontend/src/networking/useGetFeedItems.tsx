import { useState, useEffect, useRef } from 'react'
import { Topic } from './useGetTopicTabs'
import { Feed } from './useGetFeeds'
import { authFetch } from '../utils/fetch'
import { parse } from 'cache-parser'
import { config } from '../utils/config'
import { search } from './search'

export type FeedItem = {
  id: string
  feed: string
  feedname: string
  title: string
  url: string
  author?: string
  image?: string
  published?: Date
  description: string
}

type FeedItemResponse = {
  error?: any
  items?: FeedItem[]
  discoverItemErrors?: unknown
  isLoading: boolean
  setTopic: (topic: Topic) => void
  activeTopic: Topic
  setSelectedFeed: (feed: Feed) => void
  activeFeed: Feed
  hasMore: boolean
  page: number
  setPage: (page: number) => void
  clearCache: () => void
  setSearchTerm: (term: string | null) => void
  searchTerm: string | null
}

type FeedItemCacheEntry = {
  [key: string]: { response: any; expires: Date }
}

export function useGetFeedItems (
  startingTopic: Topic,
  selectedFeed: Feed,
  limit = 10
): FeedItemResponse {
  const [activeTopic, setTopic] = useState(startingTopic)
  const [activeFeed, setSelectedFeed] = useState(selectedFeed)
  const [discoverItems, setDiscoverItems] = useState<FeedItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(0)
  const cache = useRef<FeedItemCacheEntry>({})
  const clearCache = () => {
    cache.current = {}
  }
  const [searchTerm, setSearchTerm] = useState<string | null>(null)

  const callDiscoverItems = async () => {
    const topicQueryParam = activeTopic.name === 'All' ? null : activeTopic.id
    const activeFeedParam = activeFeed.id === '0' ? null : activeFeed.id

    const cached =
      cache.current[`${activeFeedParam}/${topicQueryParam}/${page}/${limit}`]
    if (
      cached &&
      cached.expires.getTime() > Date.now() &&
      cached.response.items.length > 0
    ) {
      console.log(cached.expires)
      return cached.response
    }

    const urlParams = new URLSearchParams({
      limit: `${limit}`,
      page: `${page}`
    })

    if (topicQueryParam) {
      urlParams.append('topicId', topicQueryParam)
    }

    if (activeFeedParam) {
      urlParams.append('feedId', activeFeedParam)
    }

    const response = await authFetch(
      `${config.apiEndpoint}/items?` + urlParams.toString()
    )
    const json = await response.json()

    const { maxAge } = parse(
      response.headers.get('Cache-Control') ?? 'maxAge=0'
    )
    const dateExpires = new Date(Date.now() + (maxAge ?? 0) * 1000)

    cache.current[`${activeFeedParam}/${topicQueryParam}/${page}/${limit}`] = {
      response: json,
      expires: dateExpires
    }

    return json
  }

  useEffect(() => {
    setIsLoading(true)
    if (!!searchTerm) { 
      search(searchTerm)
        .then(it => { 
          setDiscoverItems(it.search);
          setIsLoading(false  )
        })
      return 
    }

    let currDiscoveryItems = discoverItems

    if (page === 0) {
      currDiscoveryItems = []
      setDiscoverItems([])
    }

    callDiscoverItems().then((it: any) => {
      setIsLoading(false)
      setDiscoverItems([...currDiscoveryItems, ...(it.items || [])])
      setHasMore(it.hasMore)
    })
  }, [activeFeed, activeTopic, page, searchTerm])

  return {
    setTopic: (topic: Topic) => {
      setPage(0)
      setTopic(topic)
    },
    activeTopic,
    activeFeed,
    setSelectedFeed: (feed: Feed) => {
      setPage(0)
      setSelectedFeed(feed)
    },
    setSearchTerm,
    searchTerm,
    items: discoverItems,
    isLoading,
    hasMore,
    clearCache,
    page,
    setPage
  }
}
