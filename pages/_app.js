import "cropperjs/dist/cropper.css";
import '../styles/globals.css'
import { AuthenticationProvider, useAuthentication } from 'swrlit'
import { useRouter } from 'next/router'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import Head from 'next/head'

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
    <>
      <Head>
        <title>hypey</title>
        <meta name="description" content="get hypey" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <DndProvider backend={HTML5Backend}>
        <Component {...pageProps} />
      </DndProvider>
    </>
  )
}

function AuthedApp({ pageProps, ...rest }) {
  const { statusCode } = pageProps
  const router = useRouter()
  // if we try to render auth around the 404 it triggers an infinite redirect loop,
  // I think because the 404 is a special static page in Next.js? to avoid this, don't render
  // auth around the 404 page
  return (statusCode == 404) ? (
    <MyApp pageProps={pageProps} {...rest} />
  ) : (
    <AuthenticationProvider onSessionRestore={url => router.replace(url)}>
      <RenderAfterAuthed>
        <MyApp pageProps={pageProps} {...rest} />
      </RenderAfterAuthed>
    </AuthenticationProvider>
  )
}


export default AuthedApp
