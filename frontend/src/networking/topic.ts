import { config } from '../utils/config'
import { authFetch } from '../utils/fetch'
import { Topic } from './useGetTopicTabs'

export type TopicCreationPayload = {
  name: string
  related: string[]
}

export const addTopic = async (
  topicCreation: TopicCreationPayload
): Promise<{ topic: Topic }> => {
  return authFetch(`${config.apiEndpoint}/topics`, {
    method: 'POST',
    body: JSON.stringify(topicCreation)
  }).then(it => it.json() as unknown as { topic: Topic })
}

export const deleteTopic = async (topicId: string): Promise<boolean> => {
  return authFetch(`${config.apiEndpoint}/topics/${topicId}`, {
    method: 'DELETE'
  }).then(it => it.status === 200)
}

export const hideTopic = async (topicId: string, hideStatus: boolean): Promise<Topic> => {
  return authFetch(`${config.apiEndpoint}/topics/${topicId}`, {
    method: 'PATCH',
    body: JSON.stringify({ hidden: hideStatus })
  }).then(it => it.json())
}
