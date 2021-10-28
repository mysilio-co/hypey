const HYPEY_PREFIX = "https://vocab.mysilio.com/alpha/hype#";

export const HYPE = [
  'App', 'Collage', 'Element',
  'hasCollages', 'hasElement', 'imageUploadContainer', 'backgroundImageUrl',
  'imageUrl', 'elementX', 'elementY', 'elementWidth'
].reduce((m, v) => {
  m[v] = `${HYPEY_PREFIX}${v}`
  return m
}, {})

