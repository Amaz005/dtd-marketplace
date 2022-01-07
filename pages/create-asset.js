import { useEffect, useState} from 'react'
import { ethers } from 'ethers'
import {create as ipfsHttpClient} from 'ipfs-http-client'
import {useRouter} from 'next/router'
import Web3Modal from 'web3modal'
import Image from 'next/image'
import {
    nftAddress, nftMarketAddress
} from '../config'
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import Navbar from '../components/Navbar.jsx'
import { useAlert } from 'react-alert'

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

export default function CreateItem({provider, web3Provider}) {
    const [fileURI, setFileURI] = useState(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const alert = useAlert()
    const formik = useFormik({
        initialValues: {assetName: '', description: '',price: 0},
        validationSchema: Yup.object({
            assetName: Yup.string()
                .min(2, "Mininum 3 characters")
                .max(15, "Maximum 15 characters")
                .required("Required!")  

        }),
        onSubmit: async (values, setSubmitings) => {
            console.log(1)
            await createItem(values)
            setSubmitings(false)
        }
    })

    useEffect(() => {
        if(provider) {
            provider.on("accountsChanged",handleAccountsChanged)
        }
    }, [provider])
    
    const handleAccountsChanged = () => {
        loadNFTs()
    }

    const onChange = async (e) => {
        const file = e.target.files[0]
        try {
            const added = await client.add(
                file,
                {
                    progress: (prop) => console.log("received:",prop)
                }
            )
            const url = `https://ipfs.infura.io/ipfs/${added.path}`
            setFileURI(url);
        } catch (error) {
            console.log(error)
        }
    }

    const createItem = async (values) => {
        if(!web3Provider) {
            return null
        }
        const signer = web3Provider.getSigner()
        
        let contract = new ethers.Contract(nftAddress, NFT.abi, signer)
        const creater = await signer.getAddress()
        const data = JSON.stringify({name: values.assetName,description: values.description, image: fileURI, creater: creater})
        try {
            const added = await client.add(data)
            const url = `https://ipfs.infura.io/ipfs/${added.path}`
            createSale(url, contract)
        } catch (error) {
            alert.error(error)
        }
    }

    const createSale = async (url, contract) => {

        try {
            let transaction = await contract.createToken(url)
            setLoading(true)
            let tx = await transaction.wait()
            await transaction.wait()
            setLoading(false)
            router.push('/sell-asset')
        } catch (error) {
            alert.error(error.message)
        }
        
    }

    return ( 
    <>
        <Navbar web3Provider={web3Provider} provider={provider} isLoading={loading}/>
        <div className="w-full max-w-xs justify-center flex m-auto">
                <form 
                    onSubmit={formik.handleSubmit}
                    className="bg-white mt-10 px-8 pt-6 pb-8 mb-4 rounded border"
                >
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="assetName">
                            AssetName
                        </label>
                        <input 
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            name="assetName"
                            id="assetName"
                            placeholder="Asset Name"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.assetName}
                        />
                        {formik.errors.assetName && formik.touched.assetName && (
                            <p className="error-message">{formik.errors.assetName}</p>
                        )}
                    </div>
                    <div className="mb-2">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                            Description
                        </label>
                        <textarea
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            name="description"
                            id="description"
                            placeholder="Asset Description"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.description}
                        />
                    </div>
                    
                        <input
                            type="file"
                            name="file"
                            accept="image/*"
                            className="my-4 file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-violet-50 file:text-violet-700
                            hover:file:bg-violet-100"
                            onChange={onChange}
                        />
                        {
                            fileURI && (
                                <Image 
                                    alt="Mountains" 
                                    src={fileURI} 
                                    height={100} 
                                    width={200} 
                                    layout="responsive" 
                                    className="custom-img"
                                />
                            )
                        }
                        <button 
                            type="submit" 
                            disabled={formik.isSubmitting}
                            className="font-bold mt-4 bg-gray-500 text-white rounded p-4 shadow-lg">
                            Create Digital Asset
                        </button>
                </form>
        </div>
        </>
    )
}