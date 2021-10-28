import { useCallback, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useWebId, useThing, useLoggedIn, useAuthentication } from 'swrlit'
import {
  getUrl, getUrlAll, addUrl, createContainerAt,
  setThing, getThing, asUrl
} from '@inrupt/solid-client'
import Link from 'next/link'

import { Loader } from '../components/elements'
import ImageUploader from '../components/ImageUploader'
import { HYPE } from '../vocab'
import { useHypeyContainerUrl, useImageUploadContainerUrl } from '../hooks/app'
import { appResourceName, buildNewApp, buildNewCollage, isUrl } from '../model/app'

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

function collagePath(collage) {
  return `/collages/${encodeURIComponent(asUrl(collage))}`
}

function NewCollageCreator() {
  const webId = useWebId()
  const { app, resource: appResource, saveResource: saveAppResource } = useHypeyApp()
  const imageUploadContainerUrl = useImageUploadContainerUrl(webId)
  const router = useRouter()

  const onSave = useCallback(async function onSave(url) {
    const newCollage = buildNewCollage(url, webId)
    const newApp = addUrl(app, HYPE.hasCollages, newCollage)
    const savedResource = await saveAppResource(
      setThing(setThing(appResource, newApp), newCollage)
    )
    const persistedCollage = getThing(savedResource, newCollage.url)
    router.push(collagePath(persistedCollage))
  }, [app, appResource, saveAppResource, router])
  return (
    <ImageUploader onSave={onSave} imageUploadContainerUrl={imageUploadContainerUrl} buttonContent="pick a background image" />
  )
}

function Collage({ url }) {
  const { thing: collage } = useThing(url)
  const backgroundImageUrl = collage && getUrl(collage, HYPE.backgroundImageUrl)
  return (
    <Link href={collage ? collagePath(collage) : ""}>
      <a>
        <div>
          {backgroundImageUrl && (
            <img src={backgroundImageUrl} alt="background image" />
          )}
        </div>
      </a>
    </Link>
  )
}

function Collages() {
  const { app } = useHypeyApp()
  const collageUrls = app && getUrlAll(app, HYPE.hasCollages)
  // collage URLs are just their hash (ie, #12353254364) until the app is persisted, so make
  // sure we don't try to render a collage until we have a real URL to work with
  const persistedCollageUrls = collageUrls && collageUrls.filter(u => isUrl(u))
  return (
    <div className="flex flex-col">
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
      {getUrl(app, HYPE.hasCollages) && (
        <Collages />
      )}
      <NewCollageCreator />

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
  const [idp, setIdp] = useState("")

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
                <button className="btn-inset btn-lg mb-2"
                  onClick={() => {
                    login({ oidcIssuer: "https://inrupt.net", redirectUrl: window.location.href, clientName: "Hypey" })
                  }}>log in with inrupt.net!</button>
                <button className="btn-inset btn-lg mb-2"
                  onClick={() => {
                    login({ oidcIssuer: "https://mysilio.me", redirectUrl: window.location.href, clientName: "Hypey" })
                  }}>log in with mysilio.me!</button>
                <button className="btn-inset btn-lg mb-2"
                  onClick={() => {
                    login({ oidcIssuer: "https://solidcommunity.net", redirectUrl: window.location.href, clientName: "Hypey" })
                  }}>log in with solidcommunity.net!</button>
                <h3 className="mb-2">OR</h3>
                <input className="mb-1 w-72 h-12 rounded-full text-lg px-4 focus:outline-none focus:ring focus:ring-teal-300"
                  type="url" value={idp} onChange={e => setIdp(e.target.value)} />
                <button className="btn-inset btn-lg mb-2"
                  onClick={() => {
                    login({ oidcIssuer: idp, redirectUrl: window.location.href, clientName: "Hypey" })
                  }}>log in with a different identity provider!</button>
              </>
            )
          )
        }

      </main >
    </div >
  )
}
