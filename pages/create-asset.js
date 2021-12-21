import { useState} from 'react'
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
const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')


export default function CreateItem() {
    const [fileURI, setFileURI] = useState(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const formik = useFormik({
        initialValues: {assetName: '', description: '',price: 0},
        validationSchema: Yup.object({
            assetName: Yup.string()
                .min(2, "Mininum 3 characters")
                .max(15, "Maximum 15 characters")
                .required("Required!"),
            price: Yup.number()
                .min(0.01, "Mininum 0.01 number")
                .required("Required!")   

        }),
        onSubmit: async (values, setSubmitings) => {
            await createItem(values)
            setSubmitings(false)
        }
    })

    const onChange = async (e) => {
        const file = e.target.files[0]
        console.log("file: ",file);
        try {
            const added = await client.add(
                file,
                {
                    progress: (prop) => console.log("received:",prop)
                }
            )
            const url = `https://ipfs.infura.io/ipfs/${added.path}`
            console.log(url);
            setFileURI(url);
        } catch (error) {
            console.log(error)
        }
    }

    const createItem = async (values) => {
        console.log("values:", values)
        const data = JSON.stringify({name: values.assetName,description: values.description, image: fileURI})
        console.log("data: ", data)
        try {
            const added = await client.add(data)
            const url = `https://ipfs.infura.io/ipfs/${added.path}`
            createSale(url)
        } catch (error) {
            console.log(error)
        }
    }

    const createSale = async (url) => {
        const web3modal = new Web3Modal()
        const connection = await web3modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()
        
        let contract = new ethers.Contract(nftAddress, NFT.abi, signer)
        
        let transaction = await contract.createToken(url)
        setLoading(true)
        let tx = await transaction.wait()
        setLoading(false)
        console.log("pass", tx)
        let tokenId = tx.events[0].args[2].toNumber()
        console.log("tokenId: ",tokenId)
        const price = ethers.utils.parseUnits(formik.values.price.toString(), "wei")
        console.log("price: ",price)
        contract = new ethers.Contract(nftMarketAddress, Market.abi, signer)
        
        let listingPrice = await contract.getListingPrice()
        console.log("listingPrice",listingPrice)
        listingPrice = listingPrice.toString()
        transaction = await contract.createMarketItem(nftAddress, tokenId, price, {value : listingPrice})
        setLoading(true)
        await transaction.wait()
        setLoading(false)
        router.push('/')
    }

    return (
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
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="price">
                            Price
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            type="number"
                            name="price"
                            id="price"
                            placeholder="Asset Price in Eth"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.price}
                        />
                        {formik.errors.price && formik.touched.price && (
                            <p className="error-message">{formik.errors.price}</p>
                        )}
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
    )
}