import {ethers} from 'ethers'
import Web3Modal from 'web3modal'
import { useAlert } from 'react-alert'
import {useFormik} from 'formik'
import {verifyAddress} from '../config'
import VerifyContract from '../artifacts/contracts/VerifyContract.sol/VerifyContract.json'

export default function SignMessage() {
    const formik = useFormik({
        initialValues: {message: ''},
        onSubmit: async (values, setSubmitings) => {
            console.log(1)
            sendMessage()
        }
    })
    const alert = useAlert()

    const sendMessage = async () => {
        const web3modal = new Web3Modal()
        const connect = await web3modal.connect()
        const provider = new ethers.providers.Web3Provider(connect)
        const signer = provider.getSigner()
        const myAccount = await signer.getAddress();
        
        var deadline = Date.now() + 100000;
        const value = await signer.provider.send('net_version', [])
        console.log('value',value)
        const msgParams = JSON.stringify({types:
            {
            set:[
                {name:"sender",type:"address"},
                {name:"content",type:"string"},
                {name:"deadline", type:"uint256"}
            ]
            },
            primaryType:"set",
            domain:{name:"SetTest",version:"1", chainId: value,verifyingContract: verifyAddress},
            message:{
                sender: myAccount,
                content: formik.values.message,
                deadline: deadline
            }
        })
        const signature = await signer.provider.send("eth_signTypedData_v4", [myAccount,msgParams])
        
        console.log('signature: ', signature)
        const contract = new ethers.Contract(verifyAddress, VerifyContract.abi, signer)
        try{
            const transaction = await contract.executeMyFunctionFromSignature(signature, myAccount, deadline, formik.values.message)
            await transaction.wait()
            alert.success("Success!", transaction)
        } catch (error) {
            console.log("Error occurred: ",error)
        }
        

    }
    return (
        <>
            <div className="w-full max-w-xs justify-center flex m-auto">
                <form 
                    onSubmit={formik.handleSubmit}
                    className="bg-white mt-10 px-8 pt-6 pb-8 mb-4 rounded border"
                >
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="message">
                            Message
                        </label>
                        <input 
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            name="message"
                            id="message"
                            placeholder="Message"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.message}
                        />
                        {formik.errors.message && formik.touched.message && (
                            <p className="error-message">{formik.errors.message}</p>
                        )}
                    </div>
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