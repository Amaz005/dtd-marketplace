import { useEffect, useState} from 'react'
import { ethers } from 'ethers'
import {useRouter} from 'next/router'
import Image from 'next/image'
import {
    generateTokenId,
    createLazyMint,
    putLazyMint,
} from '../util/rarible/raribleRequests';
import { useFormik } from 'formik'
import * as Yup from 'yup'
import Navbar from '../components/Navbar.jsx'
import { useAlert } from 'react-alert'
import {assetAddresses} from '../contants/address'
import {
    currentNetwork,
    apiDomain,
} from '../config_network';
import {uploadToIPFS} from '../util/ipfs'
import {readFileSync, showFile} from '../util/readFileSync'
import axios from 'axios'

const mintFormInitial = {
    id: assetAddresses[currentNetwork].address,
    type: `ERC721`,
    isLazy: true,
    isLazySupported: true,
    loading: false,
}

export default function CreateItem({accounts, provider, web3Provider}) {
    const [fileURI, setFileURI] = useState(null)
    const [fileToUpload, setFileToUpload] = useState(null)
    const [loading, setLoading] = useState(false)
    const [tokenId, setTokenId] = useState('');
    const [collection, setCollection] = useState(mintFormInitial)

    const router = useRouter()
    const alert = useAlert()
    const formik = useFormik({
        initialValues: {assetName: '', description: '', royalties: 0},
        validationSchema: Yup.object({
            assetName: Yup.string()
                .min(2, "Mininum 3 characters")
                .max(15, "Maximum 15 characters")
                .required("Required!"),
            royalties: Yup.number()
                .min(0, "Mininum 3 characters")
                .max(10, "Maximum 15 characters")
                .required("Required!")
        }),
        onSubmit: async (values) => {
            await createItem(values)
        }
    })

    const connectWalletHandler = async () => {
        await web3Provider.send(`eth_requestAccounts`, []);
    };

    useEffect(() => {
        if(provider) {
            provider.on("accountsChanged",handleAccountsChanged)
        }
    }, [provider])
    
    const handleAccountsChanged = () => {
        loadNFTs()
    }

    const onChange = async (e) => {
        const fileToUpload = e.target.files[0]
        setFileToUpload(fileToUpload)
        const fileToShow = await showFile(fileToUpload)
        setFileURI(fileToShow)
    }

    const createItem = async (data) => {
        const fileAsArrayBuffer = await readFileSync(fileToUpload);
        const ipfsImagePath = await uploadToIPFS(fileAsArrayBuffer);
        if (!fileAsArrayBuffer || !accounts[0]) {
            return null
        }

        const url = `https://ipfs.infura.io/ipfs/${ipfsImagePath}`
        const res = await axios.get(url)
        const correctImageUrl = res.request?.responseURL
        setFileURI(url)
        const json = {
            description: data.description || ``,
            name: data.assetName,
            image: correctImageUrl,
            attributes: [],
            external_url: ``,
        };
        
        const fullObjectHash = await uploadToIPFS(JSON.stringify(json));
        const newTokenId = await generateTokenId(collection.id, accounts[0]);
        setTokenId(newTokenId);

        const form = await createLazyMint(
            newTokenId,
            provider,
            collection.id,
            accounts[0],
            fullObjectHash,
          { account: accounts[0], value: data.royalties * 100 },
        );
    
        console.log(form);
        await putLazyMint(form);
        await handleGetMyNfts(accounts[0])
    }

    const handleGetMyNfts = async (owner) => {
        const { data } = await axios.get(
            `${apiDomain}/protocol/v0.1/ethereum/nft/items/byOwner`,
            {
                    params: {
                    owner,
                },
            },
        );
    
        console.log(data.items);
    };

    return ( 
    <>
        <Navbar web3Provider={web3Provider} provider={provider} isLoading={loading}/>
        <div className="w-full max-w-xs justify-center flex m-auto">
                <form 
                    onSubmit={formik.handleSubmit}
                    className="bg-white mt-10 px-8 pt-6 pb-8 mb-4 rounded border"
                >
                    <div className="mb-4">
                        <label className="after:content-['*'] after:ml-0.5 after:text-red-500 block text-sm font-medium text-gray-700" htmlFor="assetName">
                            AssetName
                        </label>
                        <input 
                            className="mt-1 px-3 py-2 bg-white border shadow-sm border-gray-300 placeholder-gray-400 focus:outline-none focus:border-sky-500 focus:ring-sky-500 block w-full rounded-md sm:text-sm focus:ring-1"
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
                        <label className="after:content-['*'] after:ml-0.5 after:text-red-500 block text-sm font-medium text-gray-700" htmlFor="description">
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
                    <div className="mb-2">
                        <label className="after:content-['*'] after:ml-0.5 after:text-red-500 block text-sm font-medium text-gray-700" htmlFor="royalties">
                            Royalties
                        </label>
                        <input 
                            className="mt-1 px-3 py-2 bg-white border shadow-sm border-gray-300 placeholder-gray-400 focus:outline-none focus:border-sky-500 focus:ring-sky-500 block w-full rounded-md sm:text-sm focus:ring-1"
                            name="royalties"
                            id="royalties"
                            placeholder="Royalties"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.royalties}
                        />
                        {formik.errors.royalties && formik.touched.royalties && (
                            <p className="error-message">{formik.errors.royalties}</p>
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
                                    className="custom-img object-contain"
                                />
                            )
                        }
                        {!formik.isSubmitting ?
                        <button 
                            type="submit" 
                            disabled={formik.isSubmitting}
                            className="font-bold mt-4 bg-gray-500 text-white rounded p-4 shadow-lg">
                            Create Digital Asset
                        </button>
                        :
                        <button type="button" className="font-bold mt-4 bg-gray-500 text-white rounded p-4 shadow-lg" disabled>
                            <svg className="animate-spin mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </button>
                        }
                        

                </form>
        </div>
        </>
    )
}