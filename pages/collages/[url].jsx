import { useCallback } from 'react'
import { useRouter } from 'next/router'
import { useThing, useWebId } from 'swrlit'
import { getUrl, getUrlAll, setThing, addUrl, getInteger, setInteger } from '@inrupt/solid-client'

import { HYPE } from '../../vocab'
import ImageUploader from '../../components/ImageUploader'
import { useImageUploadContainerUrl } from '../../hooks/app'
import { buildNewElement } from '../../model/app'


function Element({ url }) {
  console.log("URL", url)
  const { thing: element } = useThing(url)
  const imageUrl = element && getUrl(element, HYPE.imageUrl)
  const x = element && getInteger(element, HYPE.elementX)
  const y = element && getInteger(element, HYPE.elementY)
  const style = {}
  style.left = x || 0
  style.top = y || 0
  style.width = '100px';
  return (
    <img src={imageUrl}  className="absolute" style={style}/>
  )

}

function Collage({ url }) {
  const webId = useWebId()
  const imageUploadContainerUrl = useImageUploadContainerUrl(webId)

  const {
    thing: collage, resource: collageResource, saveResource: saveCollageResource
  } = useThing(url)

  const onSaveNewElement = useCallback(function (elementUrl) {
    async function asyncSaveNewElement(){
      const element = buildNewElement(elementUrl)
      let newCollageResource = setThing(collageResource, element)
      newCollageResource = setThing(newCollageResource, addUrl(collage, HYPE.hasElement, element))
      await saveCollageResource(newCollageResource)
    }
    asyncSaveNewElement()
  }, [collage, collageResource, saveCollageResource])

  const backgroundImageUrl = collage && getUrl(collage, HYPE.backgroundImageUrl)
  const elementUrls = collage && getUrlAll(collage, HYPE.hasElement)
  console.log("element", elementUrls)
  return (
    <div className="flex flex-col">
      <div className="relative">
        {backgroundImageUrl && (
          <img src={backgroundImageUrl} alt="background image" />
        )}
        { elementUrls && elementUrls.map(url => (
          <Element url={url} key={url}/>
        )) }
      </div>
      <ImageUploader onSave={onSaveNewElement} imageUploadContainerUrl={imageUploadContainerUrl} />
    </div>
  )
}

export default function CollagePage() {
  const { query: { url } } = useRouter()
  const collageUrl = url && decodeURIComponent(url)
  return (
    <Collage url={collageUrl} />
  )
}