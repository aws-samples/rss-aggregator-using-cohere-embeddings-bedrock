import { config } from "../utils/config"
import { authFetch } from "../utils/fetch"
import { FeedItem } from "./useGetFeedItems"

export const search = async (
    searchTerm: string,
    feedId: string | undefined = undefined
  ): Promise<{ search: FeedItem[] }> => {
    return authFetch(`${config.apiEndpoint}/search`, {
      method: 'POST',
      body: JSON.stringify({ searchTerm, feedId })
    }).then(it => it.json() as unknown as {  search: FeedItem[] })
  }