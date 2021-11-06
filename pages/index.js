import { useCallback, useState } from 'react'
import { useRouter } from 'next/router'
import { useWebId, useThing, useLoggedIn, useAuthentication } from 'swrlit'
import {
  getUrl, getUrlAll, addUrl, createContainerAt,
  setThing, getThing, asUrl
} from '@inrupt/solid-client'
import Link from 'next/link'
import { Dialog } from '@headlessui/react'

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
  }, [webId, app, appResource, saveAppResource, router])
  return (
    <ImageUploader onSave={onSave} imageUploadContainerUrl={imageUploadContainerUrl} buttonContent="pick background image" />
  )
}

function Collage({ url }) {
  const { thing: collage } = useThing(url)
  const backgroundImageUrl = collage && getUrl(collage, HYPE.backgroundImageUrl)
  return (
    <Link href={collage ? collagePath(collage) : ""}>
      <a>
        <div className="floating">
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
    <div className="grid grid-cols-1 sm:grid-cols-2 p-8">
      {persistedCollageUrls && persistedCollageUrls.map(url =>
      (
        <Collage url={url} key={url} />
      ))}
    </div>
  )
}

function NewCollageCreatorDialog(props) {
  return (
    <Dialog
      {...props}
      className="fixed z-10 inset-0 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <div className="relative bg-white rounded max-w-sm mx-auto text-center p-4">
          <Dialog.Title className="text-4xl">
            Create a new collage
          </Dialog.Title>
          <NewCollageCreator />
        </div>
      </div>
    </Dialog>
  )
}

function LoggedIn() {
  const { logout } = useAuthentication()
  const { app, error, init: initApp } = useHypeyApp()
  const [dialogOpen, setDialogOpen] = useState(false)
  return app ? (
    <>
      <div className="w-screen bg-gradient-header flex flex-row justify-between shadow-lg">
        <button className="btn-md btn-header" onClick={() => setDialogOpen(true)}>create new collage</button>
        <NewCollageCreatorDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
        <button className="btn-md btn-header" onClick={() => logout()}>
          log out
        </button>
      </div>
      {getUrl(app, HYPE.hasCollages) ? (
        <Collages />
      ) : (
        <div className="mt-8 font-logo text-standard-gradient text-2xl">
          click <span className="font-mono">create new collage</span> above to get started!
        </div>
      )}

    </>
  ) : (
    (error && (error.statusCode == 404)) ? (
      <div className="flex flex-col items-center gap-4 text-white font-black font-4xl">
        <h2 className="mt-24 text-6xl text-gray-900 font-logo text-standard-gradient pb-4">Oh you must be new here!</h2>
        <h2 className="mt-16 text-4xl text-gray-900 font-logo text-standard-gradient pb-4">Are you ready to</h2>
        <button className="btn-floating btn-xl font-6xl px-4 py-3" onClick={initApp}>GET HYPEY?!</button>
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
  const error = isUrl(idp) && "Must be a valid URL."

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100">
      <main className="flex flex-col items-center">
        {
          (loggedIn === undefined) ? (
            <Loader />
          ) : (
            loggedIn ? (
              <LoggedIn />
            ) : (
              <>
                <h1 className="text-standard-gradient text-9xl pb-8 mb-16 font-black font-logo">
                  hypey
                </h1>
                <button className="btn-floating btn-lg mb-2"
                  onClick={() => {
                    login({ oidcIssuer: "https://inrupt.net", redirectUrl: window.location.href, clientName: "Hypey" })
                  }}>log in with inrupt.net!</button>
                <button className="btn-floating btn-lg mb-2"
                  onClick={() => {
                    login({ oidcIssuer: "https://mysilio.me", redirectUrl: window.location.href, clientName: "Hypey" })
                  }}>log in with mysilio.me!</button>
                <button className="btn-floating btn-lg mb-2"
                  onClick={() => {
                    login({ oidcIssuer: "https://solidcommunity.net", redirectUrl: window.location.href, clientName: "Hypey" })
                  }}>log in with solidcommunity.net!</button>
                <h3 className="mb-2 font-mono font-bold text-2xl">OR</h3>
                <input className="mb-1 w-96 h-12 text-lg px-4 focus:outline-none focus:ring focus:ring-my-ocean mb-2"
                  type="url" value={idp} onChange={e => setIdp(e.target.value)} />
                {error && <span className="color-my-ember">{error}</span>}
                <button className="btn-floating btn-lg mb-2 w-96"
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
