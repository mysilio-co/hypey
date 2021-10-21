import '../styles/globals.css'
import { AuthenticationProvider } from 'swrlit'

function MyApp({ Component, pageProps }) {
  return (
    <AuthenticationProvider>
      <Component {...pageProps} />
    </AuthenticationProvider>
  )
}

export default MyApp
