import "cropperjs/dist/cropper.css";
import '../styles/globals.css'
import { AuthenticationProvider } from 'swrlit'
import { useRouter } from 'next/router'

function MyApp({ Component, pageProps }) {
  const router = useRouter()
  return (
    <AuthenticationProvider onSessionRestore={url => router.replace(url)}>
      <Component {...pageProps} />
    </AuthenticationProvider>
  )
}

export default MyApp
