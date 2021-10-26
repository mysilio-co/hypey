import "cropperjs/dist/cropper.css";
import '../styles/globals.css'
import { AuthenticationProvider } from 'swrlit'
import { useRouter } from 'next/router'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'


function MyApp({ Component, pageProps }) {
  const router = useRouter()
  return (
    <AuthenticationProvider onSessionRestore={url => router.replace(url)}>
      <DndProvider backend={HTML5Backend}>
        <Component {...pageProps} />
      </DndProvider>
    </AuthenticationProvider>
  )
}

export default MyApp
