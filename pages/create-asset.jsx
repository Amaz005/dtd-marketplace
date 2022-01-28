import { useEffect, useState} from 'react'
import {useRouter} from 'next/router'
import Image from 'next/image'
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
import { NftCollectionType } from "@rarible/ethereum-api-client/build/models/NftCollection"
import { NftCollectionFeatures, NftItem } from "@rarible/ethereum-api-client"
import debounce from "../util/debounce"

const mintFormInitial = {
    id: assetAddresses[currentNetwork].address,
    type: NftCollectionType.ERC721,
    isLazy: true,
    isLazySupported: true,
    loading: false,
}

export default function CreateItem({accounts, provider, web3Provider, raribleSDK}) {
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
        console.log("changed account")
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
        const nftCollection = await sdk.apis.nftCollection.getNftCollectionById({ collection: collection.id })
        const resp = await sdk.nft.mint({
            collection: nftCollection,
            uri: `ipfs://ipfs/${fullObjectHash}`,
            creators: [{ account: toAddress(accounts[0]), value: 10000 }],
            royalties: [],
            lazy: collection.isLazy,
        })
        setTokenId(resp.tokenId);
        if (tokenId) {
			/**
			 * Get minted nft through SDK
			 */
			if (collection.isLazySupported && !collection.isLazy) {
				await retry(30, async () => { // wait when indexer aggregate an onChain nft
						await getTokenById(tokenId)
					},
				)
			} else {
				await getTokenById(tokenId)
			}
		}
    }

    const getTokenById = async (tokenId) => {
		const token = await sdk.apis.nftItem.getNftItemById({ itemId: `${collection.id}:${tokenId}` })
		if (token) {
			setCreateOrderForm({
				...createOrderForm,
				contract: token.contract,
				tokenId: token.tokenId,
			})
		}
	}

    /**
	 * Create sell order from minted nft
	 */
	const createSellOrder = async () => {
		if (createOrderForm.contract && createOrderForm.tokenId && createOrderForm.price) {
			const request = {
				makeAssetType: {
					assetClass: collection.type,
					contract: toAddress(createOrderForm.contract),
					tokenId: toBigNumber(createOrderForm.tokenId),
				},
				amount: 1,
				maker: toAddress(accounts[0]),
				originFees: [],
				payouts: [],
				price: createOrderForm.price,
				takeAssetType: { assetClass: "ETH" },
			}
			// Create an order
			const resultOrder = await sdk.order.sell(request)
			if (resultOrder) {
				setPurchaseOrderForm({ ...purchaseOrderForm, hash: resultOrder.hash })
			}
		}
	}

	/**
	 * Buy order
	 */
	const handlePurchaseOrder = async () => {
		const order = await sdk.apis.order.getOrderByHash({ hash: purchaseOrderForm.hash })
		switch (order.type) {
			case "RARIBLE_V1":
				await sdk.order.buy({ order, amount: parseInt(purchaseOrderForm.amount), originFee: 0 })
				break;
			case "RARIBLE_V2":
				await sdk.order.buy({ order, amount: parseInt(purchaseOrderForm.amount) })
				break;
			case "OPEN_SEA_V1":
				await sdk.order.buy({ order, amount: parseInt(purchaseOrderForm.amount) })
				break;
			default:
				throw new Error(`Unsupported order : ${JSON.stringify(order)}`)
		}
	}

	/**
	 * Handle get NFT's owned by connected wallet
	 */
	const handleGetMyNfts = async () => {
		const items = await sdk.apis.nftItem.getNftItemsByOwner({ owner: accounts[0] })
		setOwnedItems(items?.items)
	}

	/**
	 * debounce function for define collection type by collection id(contract address)
	 */
	const searchType = debounce(async (collectionAddress) => {
		if (collectionAddress) {
			setCollection(prevState => ({ ...prevState, loading: true }))
			const collectionResponse = await sdk.apis.nftCollection.getNftCollectionById({ collection: collectionAddress })
			setCollection(prevState => ({
				...prevState,
				type: collectionResponse.type,
				isLazySupported: collectionResponse.features.includes(NftCollectionFeatures.MINT_AND_TRANSFER), // check if it supports lazy minting
				loading: false,
			}))
		}
	}, 500)

	/**
	 * input handlers
	 */
	const handleChangeCollection = async (e) => {
		const value = e.currentTarget.value
		setCollection(prevState => ({ ...prevState, id: value }))
		if (value) {
			await searchType(value)
		}
	}
	const handleChangeLazy = () => {
		setCollection(prevState => ({ ...prevState, isLazy: !prevState.isLazy }))
	}
	const handleChangeOrderContract = (e) => {
		setCreateOrderForm({ ...createOrderForm, contract: e.currentTarget.value })
	}
	const handleChangeOrderTokenId = (e) => {
		setCreateOrderForm({ ...createOrderForm, tokenId: e.currentTarget.value })
	}
	const handleChangeOrderPrice = (e) => {
		setCreateOrderForm({ ...createOrderForm, price: e.currentTarget.value })
	}
	const handleOrderHash = (e) => {
		setPurchaseOrderForm({ ...purchaseOrderForm, hash: e.currentTarget.value })
	}
	const handlePurchaseOrderAmount = (e) => {
		setPurchaseOrderForm({ ...createOrderForm, amount: e.currentTarget.value })
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