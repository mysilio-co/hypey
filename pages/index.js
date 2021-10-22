import { useCallback, useEffect } from 'react'
import Head from 'next/head'
import { useWebId, useThing, useLoggedIn, useAuthentication, useProfile } from 'swrlit'
import {
  getUrl, getUrlAll, addUrl, createContainerAt, buildThing, createThing, setThing
} from '@inrupt/solid-client'
import { WS } from '@inrupt/vocab-solid-common'

import { Loader } from '../components/elements'
import ImageUploader from '../components/ImageUploader'
import { HYPE } from '../vocab'

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

async function initializeAppResources(appContainerUrl, app, fetch) {
  const imageUploadContainerUrl = getUrl(app, HYPE.imageUploadContainer)
  // we're relying on /public existing at the root of a user's storage for now
  // if we stop doing that we may need this code to ensure everything is
  // set up with the right permissions
  //await createContainerAt(appContainerUrl, { fetch })
  //await setPublicAccess(appContainerUrl, { read: true }, { fetch })

  if (imageUploadContainerUrl) {
    await createContainerAt(imageUploadContainerUrl, { fetch })
  }
}

const appName = "app"
const appResourceName = `app.ttl#${appName}`
function buildNewApp(imageUploadContainerUrl) {
  return buildThing(createThing({ name: appName }))
    .addUrl(HYPE.imageUploadContainer, imageUploadContainerUrl)
    .build()
}

function useHypeyApp() {
  const webId = useWebId()
  const hypeyContainerUrl = useHypeyContainerUrl(webId)
  const hypeyAppUrl = hypeyContainerUrl && `${hypeyContainerUrl}${appResourceName}`
  const thingResult = useThing(hypeyAppUrl)

  const imageUploadContainerUrl = useImageUploadContainerUrl(webId)
  const { fetch } = useAuthentication()
  const initApp = useCallback(async function initApp() {
    const newApp = buildNewApp(imageUploadContainerUrl)
    await thingResult.save(newApp)
    await initializeAppResources(hypeyContainerUrl, newApp, fetch)
  }, [imageUploadContainerUrl, thingResult, fetch, hypeyContainerUrl])

  thingResult.app = thingResult.thing
  thingResult.init = initApp
  return thingResult
}

function buildNewCollage(backgroundImageUrl) {
  return buildThing(createThing())
    .addUrl(HYPE.backgroundImageUrl, backgroundImageUrl)
    .build()
}

function NewCollageCreator() {
  const webId = useWebId()
  const { app, resource: appResource, saveResource: saveAppResource } = useHypeyApp()
  const imageUploadContainerUrl = useImageUploadContainerUrl(webId)

  const onSave = useCallback(async function onSave(url) {
    const newCollage = buildNewCollage(url)
    const newApp = addUrl(app, HYPE.hasCollages, newCollage)
    await saveAppResource(
      setThing(setThing(appResource, newApp), newCollage)
    )
  }, [app, appResource, saveAppResource])
  return (
    <ImageUploader onSave={onSave} imageUploadContainerUrl={imageUploadContainerUrl} />
  )
}

function Collage({ url }) {
  const { thing: collage } = useThing(url)
  const backgroundImageUrl = collage && getUrl(collage, HYPE.backgroundImageUrl)
  return (
    <div>
      <img src={backgroundImageUrl} alt="background image"/>
    </div>
  )
}

function isUrl(url){
  try {
    new URL(url)
    return true
  } catch (_){
    return false
  }
}

function Collages() {
  const { app } = useHypeyApp()
  const collageUrls = app && getUrlAll(app, HYPE.hasCollages)
  // collage URLs are just their hash (ie, #12353254364) until the app is persisted, so make
  // sure we don't try to render a collage until we have a real URL to work with
  const persistedCollageUrls = collageUrls && collageUrls.filter(u => isUrl(u))
  return (
    <div>
      {persistedCollageUrls && persistedCollageUrls.map(url =>
      (
        <Collage url={url} key={url} />
      ))}
    </div>
  )
}

function LoggedIn() {
  const { logout } = useAuthentication()
  const { app, error, init: initApp } = useHypeyApp()

  return app ? (
    <>
      {getUrl(app, HYPE.hasCollages) ? (
        <Collages />
      ) : (
        <NewCollageCreator />
      )}
      <button className="btn-inset btn-md" onClick={() => logout()}>
        log out
      </button>
    </>
  ) : (
    (error && (error.statusCode == 404)) ? (
      <div className="flex flex-col items-center gap-4 text-white font-black font-4xl">
        <h2>Oh you must be new here!</h2>
        <h2>Are you ready to</h2>
        <button className="font-black rounded-full shadow-md hover:shadow-2xl bg-fuchsia-400 font-6xl px-4 py-3 " onClick={initApp}>GET HYPEY?!</button>
      </div>
    ) : (
      <Loader />
    )
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
