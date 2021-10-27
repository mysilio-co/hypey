import { useCallback } from 'react'
import { useRouter } from 'next/router'
import { useThing, useWebId } from 'swrlit'
import { getUrl, getUrlAll, setThing, addUrl, getInteger, setInteger, solidDatasetAsMarkdown } from '@inrupt/solid-client'
import { DCTERMS } from '@inrupt/vocab-common-rdf'
import { useDrag, useDrop } from 'react-dnd'

import { HYPE } from '../../vocab'
import ImageUploader from '../../components/ImageUploader'
import { useImageUploadContainerUrl } from '../../hooks/app'
import { buildNewElement, isUrl } from '../../model/app'



function Element({ url, editable = false }) {
  const { thing: element, resource, save: saveElement, mutate: mutateElement } = useThing(url)
  const imageUrl = element && getUrl(element, HYPE.imageUrl)
  const x = element && getInteger(element, HYPE.elementX)
  const y = element && getInteger(element, HYPE.elementY)

  const style = {}
  style.left = x || 0
  style.top = y || 0
  style.width = '100px';

  const [{ isDragging }, drag] = useDrag(() => ({
    type: HYPE.Element,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    }),
    canDrag: () => editable,
    end: async function (item, monitor) {
      const { x: newX, y: newY } = monitor.getDropResult()
      if (newX && newY) {
        try {
          await saveElement(
            setInteger(
              setInteger(element, HYPE.elementX, newX),
              HYPE.elementY, newY
            )
          )
        } catch (_) {
          // if we encounter an error saving, revalidate to reset
          mutateElement()
        }
      }
    }
  }), [saveElement, element, editable])
  return (
    <img ref={drag} src={imageUrl} className="absolute" style={style} />
  )
}

function Collage({ url }) {
  const webId = useWebId()
  const imageUploadContainerUrl = useImageUploadContainerUrl(webId)

  const {
    thing: collage, resource: collageResource, saveResource: saveCollageResource
  } = useThing(url)
  const authorWebId = collage && getUrl(collage, DCTERMS.creator)
  const editable = webId && authorWebId && (webId === authorWebId)

  const onSaveNewElement = useCallback(function (elementUrl) {

    async function asyncSaveNewElement() {
      const element = buildNewElement(elementUrl)
      let newCollageResource = setThing(collageResource, element)
      newCollageResource = setThing(newCollageResource, addUrl(collage, HYPE.hasElement, element))
      await saveCollageResource(newCollageResource)
    }
    asyncSaveNewElement()
  }, [collage, collageResource, saveCollageResource])

  const backgroundImageUrl = collage && getUrl(collage, HYPE.backgroundImageUrl)
  const elementUrls = collage && getUrlAll(collage, HYPE.hasElement)
  // element URLs are just their hash (ie, #12353254364) until the app is persisted, so make
  // sure we don't try to render an element until we have a real URL to work with
  const persistedElementUrls = elementUrls && elementUrls.filter(u => isUrl(u))
  const [, drop] = useDrop(
    () => ({
      accept: HYPE.Element,
      drop: (_, monitor) => monitor.getSourceClientOffset()
    })
  )
  return (
    <div className="flex flex-col">
      <div className="relative" ref={drop}>
        {backgroundImageUrl && (
          <img src={backgroundImageUrl} alt="background image" />
        )}
        {persistedElementUrls && persistedElementUrls.map(url => (
          <Element url={url} key={url} editable={editable} />
        ))}
      </div>
      {editable && (
        <ImageUploader onSave={onSaveNewElement} imageUploadContainerUrl={imageUploadContainerUrl} />
      )}
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