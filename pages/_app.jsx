import '../styles/globals.css'
import '../styles/styles.css'
import Head from 'next/head'
import { transitions, positions, Provider as AlertProvider } from 'react-alert'
import Alert from '../components/Alert'
import "react-datepicker/dist/react-datepicker.css"
import { Web3ReactProvider } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'
import { useWeb3React } from '@web3-react/core'
import { InjectedConnector } from '@web3-react/injected-connector'

const options = {
  position: positions.TOP_CENTER,
  timeout: 5000,
  offset: '30px',
  transition: transitions.FADE
}

export const injectedConnector = new InjectedConnector({
  supportedChainIds: [
    1, // Mainet
    3, // Ropsten
    4, // Rinkeby
    5, // Goerli
    42, // Kovan
  ],
})

const getLibrary = async (provider) => {
  const library = new Web3Provider(provider)
  library.pollingInterval = 12000
  return library
}

function MyApp({ Component, pageProps }) {
  return (
      <AlertProvider template={Alert} {...options}>
        <Web3ReactProvider getLibrary={getLibrary}>
        <div>
          <Head>
            <link rel="shortcut icon" href="./_next/static/image/public/duck-logo.3e5e8e138e5b5350fbc43676b1bc035b.svg" />
          </Head>
          
          <Component {...pageProps} />
        </div>
        </Web3ReactProvider>
      </AlertProvider>
    )
}

export default MyApp