import '../styles/globals.css'
import '../styles/styles.css'
import Head from 'next/head';
import { render } from 'react-dom';
import { transitions, positions, Provider as AlertProvider } from 'react-alert'
import Alert from '../components/Alert'

const options = {
  // you can also just use 'bottom center'
  position: positions.TOP_CENTER,
  timeout: 5000,
  offset: '30px',
  // you can also just use 'scale'
  transition: transitions.SCALE
}

function MyApp({ Component, pageProps }) {
  return (
    <AlertProvider template={Alert} {...options}>
      <div>
        <Head>
          <link rel="shortcut icon" href="./_next/static/image/public/duck-logo.3e5e8e138e5b5350fbc43676b1bc035b.svg" />
        </Head>
        
        <Component {...pageProps} />
      </div>
    </AlertProvider>
    )
}

export default MyApp
