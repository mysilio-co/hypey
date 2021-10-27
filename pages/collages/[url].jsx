import { useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import { useThing, useWebId } from 'swrlit'
import {
  getUrl, getUrlAll, setThing, addUrl, getInteger, setInteger,
  getDecimal, setDecimal, solidDatasetAsMarkdown
} from '@inrupt/solid-client'
import { DCTERMS } from '@inrupt/vocab-common-rdf'
import { useDrag, useDrop } from 'react-dnd'

import { HYPE } from '../../vocab'
import ImageUploader from '../../components/ImageUploader'
import { useImageUploadContainerUrl } from '../../hooks/app'
import { buildNewElement, isUrl } from '../../model/app'



function Element({ url, editable = false, collageRef }) {
  const { thing: element, resource, save: saveElement, mutate: mutateElement } = useThing(url)
  const imageUrl = element && getUrl(element, HYPE.imageUrl)
  const x = element && getDecimal(element, HYPE.elementX)
  const y = element && getDecimal(element, HYPE.elementY)


  const style = {}
  style.left = x ? `${x}%` : 0
  style.top = y ? `${y}%` : 0
  style.width = `10%`;

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
          if (collageRef.current.clientWidth && collageRef.current.clientHeight) {
            await saveElement(
              setDecimal(
                setDecimal(element, HYPE.elementX, (100.0 * newX / collageRef.current.clientWidth)),
                HYPE.elementY, (100.0 * newY / collageRef.current.clientHeight)
              )
            )
          }
        } catch (_) {
          // if we encounter an error saving, revalidate to reset
          mutateElement()
        }
      }
    }
  }), [saveElement, element, editable, collageRef])
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
  const imageRef = useRef()
  return (
    <div className="flex flex-col">
      <div className="relative" ref={drop}>
        {backgroundImageUrl && (
          <img src={backgroundImageUrl} alt="background image" ref={imageRef} />
        )}
        {persistedElementUrls && persistedElementUrls.map(url => (
          <Element url={url} key={url} editable={editable} collageRef={imageRef} />
        ))}
      </div>
      {editable && (
        <ImageUploader onSave={onSaveNewElement}
          imageUploadContainerUrl={imageUploadContainerUrl}
          buttonContent="add image to collage" />
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