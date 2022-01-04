import {useFormik} from 'formik'
import ethers from 'ethers'
import { useEffect } from 'react'
import loadConfig from 'next/dist/next-server/server/config'
import Web3Modal from 'web3modal'
import {
    nftAddress, nftMarketAddress,
    tokenAddress, verifyAddress
} from '../config'
import VerifyContract from '../artifacts/contracts/verifyContract.sol/verifyContract.json'
import { useAlert } from 'react-alert'

export default function SignMessage() {
    const alert = useAlert()
    const [message,setMessage] = useState()

    const sendMessage = async () => {
        const web3modal = new Web3Modal()
        const connect = await web3modal.connect()
        const provider = new ethers.providers.Web3Provider(connect)
        const signer = provider.getSigner()
        const myAccount = await signer.getAddress();
        
        var deadline = Date.now() + 100000;
        var x = 157;

        const msgParams = JSON.stringify({types:
            {
            set:[
                {name:"sender",type:"address"},
                {name:"x",type:"uint256"},
                {name:"deadline", type:"uint256"}
            ]
            },
            //make sure to replace verifyingContract with address of deployed contract
            primaryType:"set",
            domain:{verifyingContract: verifyAddress},
            message:{
                sender: myAccount,
                x: x,
                deadline: deadline
            }
        })
        const signature = await signer.provider.send("eth_signTypedData_v4", msgParams)
        const contract = await ethers.Contract(verifyAddress, VerifyContract.abi, signer)
        try{
            const transaction = await contract.executeMyFunctionFromSignature(signature, myAccount, deadline, x)
            await transaction.wait()
            alert.success("Success!")
        } catch (error) {
            console.log("Error occurred: ",error)
            alert.error(error)
        }
        
        console.log('signature: ', signature)

    }

    const handleChangeValue = (e) => {
        setMessage(e.target.value)
    }

    return (
        <div>
            Hello world!
            <form onSubmit={sendMessage}>
                <input value={message} onChange={handleChangeValue}/>
                <input type='submit'>Sign</input>
            </form>
        </div>
    )
}