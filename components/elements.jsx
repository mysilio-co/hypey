import { forwardRef } from 'react'
import ReactLoader from 'react-loader-spinner'

const PRIMARY = '#0e90a3'
const SECONDARY = '#579f89'

export const Loader = forwardRef(function Loader(props, ref) {
  return (
    <ReactLoader
      ref={ref}
      type="MutatingDots"
      color={PRIMARY}
      secondaryColor={SECONDARY}
      height={120}
      width={120}
      {...props} />
  )
})

