const HYPEY_PREFIX = "https://vocab.mysilio.com/hype#";

export const HYPE = ['Collage', 'hasCollages', 'hasElement', 'imageUploadContainer', 'backgroundImageUrl'].reduce((m, v) => {
  m[v] = `${HYPEY_PREFIX}${v}`
  return m
}, {})

