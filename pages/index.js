import Head from 'next/head'
import { useWebId, useLoggedIn, useAuthentication } from 'swrlit'
import { Loader } from '../components/elements'

export default function Home() {
  const webId = useWebId()
  const loggedIn = useLoggedIn()
  const { login, logout } = useAuthentication()

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-teal-600">
      <Head>
        <title>hypey</title>
        <meta name="description" content="get hypey" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col justify-center items-center">
        {
          (loggedIn === undefined) ? (
            <Loader />
          ) : (
            loggedIn ? (
              <>
                <div>welcome to hypey!</div>
                <button className="btn" onClick={() => logout()}>log out</button>
              </>
            ) : (
              <>
                <h1 className="text-fuchsia-400 text-center drop-shadow-2xl text-9xl mb-24 font-black">HYPEY</h1>
                <button className="rounded-full bg-teal-600 text-fuchsia-400 font-bold shadow-inner hover:shadow-lg py-4 px-6 text-xl"
                  onClick={() => {
                    login({ oidcIssuer: "https://inrupt.net", redirectUrl: window.location.href, clientName: "Hypey" })
                  }}>log in!</button>
              </>
            )
          )
        }

      </main >
    </div >
  )
}
