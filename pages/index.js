import { useCallback, useEffect } from 'react'
import Head from 'next/head'
import { useWebId, useContainer, useLoggedIn, useAuthentication, useProfile } from 'swrlit'
import { getUrl, isContainer, getSolidDataset, createContainerAt } from '@inrupt/solid-client'
import { WS } from '@inrupt/vocab-solid-common'
import { Loader } from '../components/elements'
import ImageUploader from '../components/ImageUploader'

const appPrefix = "hypey"

export function useStorageContainer(webId) {
  const { profile } = useProfile(webId)
  return profile && getUrl(profile, WS.storage)
}

export function useHypeyContainerUrl(webId) {
  const storageContainer = useStorageContainer(webId)
  return storageContainer && `${storageContainer}${appPrefix}/`
}

export function useImageUploadContainerUrl(webId) {
  const hypeyContainerUrl = useHypeyContainerUrl(webId)
  return hypeyContainerUrl && `${hypeyContainerUrl}images/`
}

function LoggedIn() {
  const webId = useWebId()
  const { logout, fetch } = useAuthentication()

  const imageUploadContainerUrl = useImageUploadContainerUrl(webId)
  useEffect(function () {
    if (imageUploadContainerUrl) {
      createContainerAt(imageUploadContainerUrl, { fetch })
    }
  }, [imageUploadContainerUrl])

  const onSave = useCallback(function onSave(url) {
    console.log("image url:", url)
  }, [])
  return (
    <>
      <ImageUploader onSave={onSave} imageUploadContainerUrl={imageUploadContainerUrl} />
      <button className="btn-inset btn-md" onClick={() => logout()}>
        log out
      </button>
    </>
  )
}

export default function Home() {
  const loggedIn = useLoggedIn()
  const { login } = useAuthentication()

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-teal-300">
      <Head>
        <title>hypey</title>
        <meta name="description" content="get hypey" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col justify-center items-center">
        {
          (loggedIn === undefined) ? (
            <Loader />
          ) : (
            loggedIn ? (
              <LoggedIn />
            ) : (
              <>
                <h1 className="text-fuchsia-400 text-center drop-shadow-2xl text-9xl mb-24 font-black">HYPEY</h1>
                <button className="btn-inset btn-lg"
                  onClick={() => {
                    login({ oidcIssuer: "https://inrupt.net", redirectUrl: window.location.href, clientName: "Hypey" })
                  }}>log in!</button>
              </>
            )
          )
        }

      </main >
    </div >
  )
}
