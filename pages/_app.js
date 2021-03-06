import '../styles/globals.css'
import '../styles/styles.css'
import Head from 'next/head'
import { transitions, positions, Provider as AlertProvider } from 'react-alert'
import Alert from '../components/Alert'
import "react-datepicker/dist/react-datepicker.css"
import {useState, useEffect} from 'react'
import Web3Modal from 'web3modal'
import {ethers} from 'ethers'
import { createRaribleSdk, RaribleSdk } from "@rarible/protocol-ethereum-sdk"
import { Web3Ethereum } from "@rarible/web3-ethereum"
import Web3 from 'web3'
import { AppProps } from 'next/dist/next-server/lib/router/router'
import WalletLink from 'walletlink'

const options = {
  position: positions.TOP_CENTER,
  timeout: 5000,
  offset: '30px',
  transition: transitions.FADE
}

// const providerOptions = {
//   walletconnect: {
//     package: WalletConnectProvider, // required
//     options: {
//       infuraId: INFURA_ID, // required
//     },
//   },
//   'custom-walletlink': {
//     display: {
//       logo: 'https://play-lh.googleusercontent.com/PjoJoG27miSglVBXoXrxBSLveV6e3EeBPpNY55aiUUBM9Q1RCETKCOqdOkX2ZydqVf0',
//       name: 'Coinbase',
//       description: 'Connect to Coinbase Wallet (not Coinbase App)',
//     },
//     options: {
//       appName: 'Coinbase', // Your app name
//       networkUrl: `https://mainnet.infura.io/v3/${INFURA_ID}`,
//       chainId: 1,
//     },
//     package: WalletLink,
//     connector: async (_, options) => {
//       const { appName, networkUrl, chainId } = options
//       const walletLink = new WalletLink({
//         appName,
//       })
//       const provider = walletLink.makeWeb3Provider(networkUrl, chainId)
//       await provider.enable()
//       return provider
//     },
//   },
// }


function MyApp({ Component, pageProps }) {
  const [provider, setProvider] = useState()
  const [accounts, setAccounts] = useState([])
  const [web3Provider, setWeb3Provider] = useState()
  const [raribleSDK, setRaribleSDK] = useState()
  
  useEffect(() => {
      handleInit();
  }, []);

  useEffect(() => {
    if(web3Provider) {
      web3Provider.listAccounts().then((accounts)=> {
        setAccounts(accounts)  
      })
    }
  }, [web3Provider])

  const handleInit = async () => {
    const web3Modal = new Web3Modal()
    if (web3Modal) {
      const connection = await web3Modal.connect()
      const web = new Web3(connection)
      const web3Ethereum = new Web3Ethereum({ web3: web })
      console.log("web3Ethereum: ", web3Ethereum)
      console.log("1")
      const env = "rinkeby" // "e2e" | "ropsten" | "rinkeby" | "mainnet"
      const raribleSdk = new createRaribleSdk(web3Ethereum, env)
      console.log("2")
      console.log("raribleSdk: ",raribleSdk)
      console.log('provider: ', connection)
      setRaribleSDK(raribleSdk)
      setProvider(connection)
      const web3provider = new ethers.providers.Web3Provider(connection)
      setWeb3Provider(web3provider)
      console.log("_app-web3Provider: ", web3Provider)
      connection.on("accountsChanged",(accounts) => {
        setAccounts(accounts)
      })
    } else {
      alert(`Please install MetaMask!`);
    }
  }

  const blockchainProps = { ...pageProps, provider, accounts, web3Provider, raribleSDK };
  return (
      <AlertProvider template={Alert} {...options}>
          <div>
            <Head>
              <link rel="shortcut icon" href="./_next/static/image/public/duck-logo.3e5e8e138e5b5350fbc43676b1bc035b.svg" />
            </Head>
          
            <Component {...blockchainProps} />
        </div>
      </AlertProvider>

      
    )
}

export default MyApp