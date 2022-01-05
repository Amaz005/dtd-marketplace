import '../styles/globals.css'
import '../styles/styles.css'
import Head from 'next/head'
import { transitions, positions, Provider as AlertProvider } from 'react-alert'
import Alert from '../components/Alert'
import "react-datepicker/dist/react-datepicker.css"

const options = {
  position: positions.TOP_CENTER,
  timeout: 5000,
  offset: '30px',
  transition: transitions.FADE
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