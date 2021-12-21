import '../styles/globals.css'
import '../styles/styles.css'
import Navbar from '../components/Navbar.js'
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  
  return (
    <div>
      <Head>
        <link rel="shortcut icon" href="./_next/static/image/public/duck-logo.3e5e8e138e5b5350fbc43676b1bc035b.svg" />
      </Head>
      <Navbar/>
      <Component {...pageProps} />
    </div>
    )
}

export default MyApp
