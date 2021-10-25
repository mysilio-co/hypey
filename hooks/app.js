import { useProfile } from 'swrlit'
import { WS } from '@inrupt/vocab-solid-common'
import { getUrl } from '@inrupt/solid-client'

const appPrefix = "hypey"

export function useStorageContainer(webId) {
  const { profile } = useProfile(webId)
  return profile && getUrl(profile, WS.storage)
}

export function useHypeyContainerUrl(webId) {
  const storageContainer = useStorageContainer(webId)
  return storageContainer && `${storageContainer}public/${appPrefix}/`
}

export function useImageUploadContainerUrl(webId) {
  const hypeyContainerUrl = useHypeyContainerUrl(webId)
  return hypeyContainerUrl && `${hypeyContainerUrl}images/`
}