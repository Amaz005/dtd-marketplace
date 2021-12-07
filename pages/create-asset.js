import { useState} from 'react';
import { ethers } from 'ethers'
import {create as ipfsHttpClient} from 'ipfs-http-client'
import {useRouter} from 'next/router'
import Web3Modal from 'web3modal'
import Image from 'next/image'
const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

import {
    nftAddress, nftMarketAddress
} from '../config'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'
import autoprefixer from 'autoprefixer';

export default function CreateItem() {
    const [fileURI, setFileURI] = useState(null)
    const [formInput, updateFormInput] = useState({price: '', name: '', description: ''})
    const router = useRouter()

    const onChange = async (e) => {
        const file = e.target.files[0]
        console.log(file);
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

    const createItem = async () => {
        const {name, description, price} = formInput
        if(!name || !description || !price)
            return
        const data = JSON.stringify({name, description, image: fileURI})

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
        console.log(signer.getAddress())
        let contract = new ethers.Contract(nftAddress, NFT.abi, signer)
        console.log(url)
        let transaction = await contract.createToken(url)
        let tx = await transaction.wait()

        console.log(tx)
        let tokenId = tx.events[0].args[2].toNumber()
        console.log(tokenId)
        const price = ethers.utils.parseUnits(formInput.price, 'ether')
        console.log(price)
        contract = new ethers.Contract(nftMarketAddress, Market.abi, signer)
        let listingPrice = await contract.getListingPrice()
        listingPrice = listingPrice.toString()
        console.log(listingPrice)
        transaction = await contract.createMarketItem(nftAddress, tokenId, price, {value : listingPrice})
        console.log('pass')
        await transaction.wait()
        router.push('/')
    }

    return (
        <div className="flex justify-center">
            <div className="w-1/2 flex flex-col pb-12">
                <input 
                    placeholder="Asset Name"
                    className="mt-8 border rounded p-4"
                    onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
                />
                <textarea
                    placeholder="Asset Description"
                    className="mt-2 border rounded p-4"
                    onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
                />
                <input
                    placeholder="Asset Price in Eth"
                    className="mt-2 border rounded p-4"
                    onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
                />
                <input
                    type="file"
                    name="Asset"
                    className="my-4"
                    onChange={onChange}
                />
                {
                    fileURI && (
                            <Image alt="Mountains" src={fileURI} height={100} width={200} layout="responsive" className="custom-img"
                            />
                    )
                }
                <button onClick={createItem} className="font-bold mt-4 bg-gray-500 text-white rounded p-4 shadow-lg">
                    Create Digital Asset
                </button>
            </div>
        </div>
    )
}