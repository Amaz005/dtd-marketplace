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

const options = {
  position: positions.TOP_CENTER,
  timeout: 5000,
  offset: '30px',
  transition: transitions.FADE
}

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
    const { ethereum } = window
    if (web3Modal) {
      const provider = await web3Modal.connect()
      console.log('provider: ', provider)
      // const web3 = new Web3(ethereum)
      // console.log('web3: ',web3)
      // const raribleSdk = createRaribleSdk(new Web3Ethereum({ web3 }), "rinkeby")
      // setRaribleSDK(raribleSdk)
      console.log('rarible: ', raribleSDK)
      setProvider(provider)
      setWeb3Provider(new ethers.providers.Web3Provider(provider))
      console.log("_app-web3Provider: ", web3Provider)
      provider.on("accountsChanged",(accounts) => {
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