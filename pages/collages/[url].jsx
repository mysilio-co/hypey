import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useThing, useWebId } from 'swrlit'
import {
  getUrl, getUrlAll, setThing, addUrl, getInteger, setInteger,
  getDecimal, setDecimal, removeThing, solidDatasetAsMarkdown, setUrl, removeUrl
} from '@inrupt/solid-client'
import { DCTERMS } from '@inrupt/vocab-common-rdf'
import { useDrag, useDrop } from 'react-dnd'
import { faLink, faArrowsAltH, faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { HYPE } from '../../vocab'
import ImageUploader from '../../components/ImageUploader'
import { useImageUploadContainerUrl } from '../../hooks/app'
import { buildNewElement, isUrl } from '../../model/app'

function elementStyle(element) {
  const x = element && (getDecimal(element, HYPE.elementX) || 0)
  const y = element && (getDecimal(element, HYPE.elementY) || 0)
  const width = element && (getDecimal(element, HYPE.elementWidth) || 10)
  const style = {}
  if (element) {
    style.left = `${x}%`
    style.top = `${y}%`
    style.width = `${width}%`;
  }
  return style
}

function Element({ url }) {
  const { thing: element } = useThing(url)
  const imageUrl = element && getUrl(element, HYPE.imageUrl)
  const linksTo = element && getUrl(element, HYPE.linksTo)

  const style = elementStyle(element)

  return (
    <div className="absolute" style={style}>
      <Link href={linksTo || "#"}>
        <a>
          <img src={imageUrl} className="object-cover" alt="collage element" />
        </a>
      </Link>
    </div>
  )
}

function EditableElement({ url, collageRef, deleteElement }) {
  const { thing: element, save: saveElement, mutate: mutateElement } = useThing(url)
  const imageUrl = element && getUrl(element, HYPE.imageUrl)
  const width = element && (getDecimal(element, HYPE.elementWidth) || 10)
  const linksTo = element && getUrl(element, HYPE.linksTo)

  const [_, drag] = useDrag(() => ({
    type: HYPE.Element,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    }),
    canDrag: () => true,
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
  }), [saveElement, element, collageRef])

  const [resizeDragStart, setResizeDragStart] = useState()
  const [resizeDragWidth, setResizeDragWidth] = useState()
  const resizeOnDrag = useCallback((e) => {
    const newResizeDragWidth = (100.0 * (e.clientX - resizeDragStart) / collageRef.current.clientWidth)
    if ((newResizeDragWidth + width) > 0) {
      setResizeDragWidth(newResizeDragWidth)
    }
    e.stopPropagation()
  }, [resizeDragStart, collageRef, width])
  const resizeOnDragStart = useCallback((e) => {
    setResizeDragStart(e.clientX)
    e.stopPropagation()
  }, [])
  const resizeOnDragEnd = useCallback(
    async (e) => {
      const newWidth = width + resizeDragWidth
      setResizeDragWidth(null)
      if (newWidth > 0) {
        await saveElement(
          setDecimal(element, HYPE.elementWidth, newWidth),
        )
      }
      e.stopPropagation()
    }, [element, resizeDragWidth, saveElement, width]
  )
  const style = element && elementStyle(element)
  if (style) {
    style.width = `${width + (resizeDragWidth || 0)}%`;
  }

  const setLink = useCallback(async () => {
    const url = prompt("link this element to what URL?", linksTo || '')
    if (url) {
      await saveElement(
        setUrl(element, HYPE.linksTo, url),
      )
    } else if (linksTo) {
      await saveElement(removeUrl(element, HYPE.linksTo, linksTo))
    }
  }, [saveElement, element, linksTo])

  return (
    <div ref={drag} className={`shadow-2xl opacity-70 absolute`} style={style}>
      <img src={imageUrl} className="object-cover" alt="collage element" />
      <div className="absolute top-0 -right-8 px-2 flex flex-col bg-white bg-opacity-80">
        <div draggable className="cursor-move mb-2"
          onDragStart={resizeOnDragStart}
          onDrag={resizeOnDrag}
          onDragEnd={resizeOnDragEnd}>
          <FontAwesomeIcon icon={faArrowsAltH} />
        </div>
        <button onClick={setLink} className="mb-2">
          <FontAwesomeIcon icon={faLink} />
        </button>
        <button onClick={() => deleteElement(element)}>
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>
    </div>
  )
}

function Collage({ url }) {
  const webId = useWebId()
  const imageUploadContainerUrl = useImageUploadContainerUrl(webId)
  const [editing, setEditing] = useState(false)
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

  const deleteElement = useCallback(async (element) => {
    const confirmed = confirm(`are you sure you want to delete this element?`)
    if (confirmed) {
      await saveCollageResource(
        setThing(
          removeThing(collageResource, element),
          removeUrl(collage, HYPE.hasElement, element)
        )
      )
    }
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
          editing ? (
            <EditableElement url={url} key={url} collageRef={imageRef} deleteElement={deleteElement} />
          ) : (
            <Element url={url} key={url} />
          )
        ))}
      </div>
      {editing ? (
        <button className="btn-md btn-floating btn-square"
          onClick={() => setEditing(false)}>
          preview collage
        </button>
      ) : (
        editable && (
          <button className="btn-md btn-floating btn-square"
            onClick={() => setEditing(true)}>
            edit collage
          </button>
        )
      )}
      {editing && (
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