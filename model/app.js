import { buildThing, createThing } from '@inrupt/solid-client'
import { RDF } from '@inrupt/vocab-common-rdf';
import { HYPE } from '../vocab'

const appName = "app"
export const appResourceName = `app.ttl#${appName}`

export function buildNewApp(imageUploadContainerUrl) {
  return buildThing(createThing({ name: appName }))
    .addUrl(RDF.type, HYPE.App)
    .addUrl(HYPE.imageUploadContainer, imageUploadContainerUrl)
    .build()
}

export function buildNewCollage(backgroundImageUrl) {
  return buildThing(createThing())
    .addUrl(RDF.type, HYPE.Collage)
    .addUrl(HYPE.backgroundImageUrl, backgroundImageUrl)
    .build()
}

export function buildNewElement(url) {
  return buildThing(createThing())
    .addUrl(RDF.type, HYPE.Element)
    .addUrl(HYPE.imageUrl, url)
    .build()
}



