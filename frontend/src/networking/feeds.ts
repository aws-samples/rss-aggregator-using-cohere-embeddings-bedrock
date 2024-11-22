import { config } from '../utils/config'
import { authFetch } from '../utils/fetch'
import { Feed } from './useGetFeeds'

export type FeedValidity = {
  isValid: boolean
  name?: string
  reason?: string
  reasonCode: string
}

export const checkFeedValidty = async (
  feedUrl: string
): Promise<FeedValidity> => {
  return authFetch(`${config.apiEndpoint}/feeds/validate`, {
    method: 'POST',
    body: JSON.stringify({ url: feedUrl })
  }).then(it => it.json() as unknown as FeedValidity)
}

export const addFeed = async (
  feedUrl: string,
  name: string
): Promise<{ feed: Feed }> => {
  return authFetch(`${config.apiEndpoint}/feeds`, {
    method: 'POST',
    body: JSON.stringify({ link: feedUrl, name })
  }).then(it => it.json() as unknown as { feed: Feed })
}

export const deleteFeed = async (feedId: string): Promise<boolean> => {
  return authFetch(`${config.apiEndpoint}/feeds/${feedId}`, {
    method: 'DELETE'
  }).then(it => it.status === 200)
}

export const updateFeed = async (
  feed: Feed,
  updatedFeed: Partial<Feed>
): Promise<Feed> => {
  return authFetch(`${config.apiEndpoint}/feeds/${feed.id}`, {
    method: 'PATCH',
    body: JSON.stringify(updatedFeed)
  }).then(it => it.json())
}
