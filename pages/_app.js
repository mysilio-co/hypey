import "cropperjs/dist/cropper.css";
import '../styles/globals.css'
import { AuthenticationProvider, useAuthentication } from 'swrlit'
import { useRouter } from 'next/router'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

function RenderAfterAuthed({ children }) {
  const { info } = useAuthentication()

  return info ? (
    <>
    {children}
    </>
  ) : (<></>)
}

function MyApp({ Component, pageProps }) {
  return (
      <DndProvider backend={HTML5Backend}>
        <Component {...pageProps} />
      </DndProvider>
  )
}

function AuthedApp(props) {
  const router = useRouter()
  return (
    <AuthenticationProvider onSessionRestore={url => router.replace(url)}>
      <RenderAfterAuthed>
        <MyApp {...props} />
      </RenderAfterAuthed>
    </AuthenticationProvider>
  )
}


export default AuthedApp
