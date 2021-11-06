import ReactLoader from 'react-loader-spinner'

const PRIMARY = '#0e90a3'
const SECONDARY = '#579f89'

export function Loader(props){
  return (
    <ReactLoader
    type="MutatingDots"
    color={PRIMARY}
    secondaryColor={SECONDARY}
    height={120}
    width={120}
    {...props} />
  )
}
