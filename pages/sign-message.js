import {ethers} from 'ethers'
import Web3Modal from 'web3modal'
import { useAlert } from 'react-alert'
import {useFormik} from 'formik'
import {verifyAddress} from '../config'
import VerifyContract from '../artifacts/contracts/VerifyContract.sol/VerifyContract.json'

export default function SignMessage() {
    const formik = useFormik({
        initialValues: {message: '', name: ''},
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
        let deadline = Date.now() + 100000;
        const value = await signer.provider.send('net_version', [])
        console.log('value',value)
        const object = JSON.stringify({
            content: formik.values.message.trim(),
            name : formik.values.name.trim()

        })
        const msgParams = JSON.stringify({types:
            {
            EIP712Domain:[
                {name:"name",type:"string"},
                {name:"version",type:"string"},
                {name:"chainId",type:"uint256"},
                {name:"verifyingContract",type:"address"}
            ],
            set:[
                {name:"sender",type:"address"},
                {name:"content",type:"string"},
                {name:"deadline", type:"uint"}
            ]
            },
            primaryType:"set",
            domain:{name:"SetTest",version:"1", chainId: value,verifyingContract: verifyAddress},
            message:{
                sender: myAccount,
                content: formik.values.message.trim(),
                deadline: deadline
            }
        })
        const signature = await signer.provider.send("eth_signTypedData_v4", [myAccount,msgParams])
        const contract = new ethers.Contract(verifyAddress, VerifyContract.abi, signer)
        
        try{
            const transaction = await contract.executeMyFunctionFromSignature(signature, myAccount, deadline, formik.values.message.trim())
            // const transaction =  await contract.executeSetIfSignatureMatch(v,r,s,myAccount, deadline, formik.values.message.trim(), { from: myAccount })
            const tmpSign = await contract.getSign()
            const tmpHashStruct = await contract.getHashStruct()
            const tmpContent = await contract.get()
            console.log("signature: ", signature)
            console.log('tmp Sign: ', tmpSign)
            console.log('my account: ', myAccount)
            console.log('tmp HashStruct: ', tmpHashStruct)
            console.log('tmp content: ', tmpContent)
            console.log("content: ", formik.values.message)
            await transaction.wait()
            alert.success("Success!")
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
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                        name
                        </label>
                        <input 
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            name="name"
                            id="name"
                            placeholder="name"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.name}
                        />
                        {formik.errors.name && formik.touched.name && (
                            <p className="error-message">{formik.errors.name}</p>
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