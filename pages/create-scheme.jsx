import {ethers} from 'ethers';
import { useFormik } from 'formik';
import * as Yup from 'yup'
import {tokenAddress,vestingAddress} from '../config'
import {useState,useEffect} from 'react'
import Vesting from '../artifacts/contracts/Vesting.sol/Vesting.json'
import Navbar from '../components/Navbar'

let scheme = {
    schemeId: 0,
    name: "",
    vestTime: 0,
    cliffTime: 0,
    durationTime: 0,
    periodTime: 0,
    tokenAddress: ""
}

let vest = {
    wallet: "",
    totalAmount: 0,
    amountDeposit: 0,
    totalClaimed: 0,
    schemeId: 0,
    startTime: Date.now()
}

const countTime = (num, type) => {
    switch(type) {
        case 0 : 
            return num * 7*24*60*60
        case 1: 
            return num * 30*24*60*60
        default :
            return num * 30*24*60*60
    }
}

export default function CreateScheme({ provider, web3Provider}) {

    const [loadToken, setLoadToken] = useState(false)
    const [isSell, setIsSell] = useState(false)
    useEffect(() => {
        console.log("create-scheme-web3Provider: ", web3Provider)
    }, [])

    const schemeFormik = useFormik({
        initialValues: {
            name: "",
            vestTime: 0,
            cliffTime: 0,
            durationTime: 0,
            type: "",
            tokenAddress: ""
        },
        validationSchema: Yup.object(
            {}
        ),
        onSubmit: async (values) => {
            console.log("values: ",values)
            await handlerSubmitScheme(values)
        }
    })
    const vestFormik = useFormik({
        initialValues: {
            wallet: "",
            totalAmount: 0,
            amountDeposit: 0,
            totalClaimed: 0,
            schemeId: 0,
            startTime: Date.now()
        },
        validationSchema: Yup.object(
            {}
        ),
        onSubmit: async (values) => {
            await handlerSubmitVesting(values)
        }
    })

    const handlerSubmitScheme = async (values) => {
        if(!web3Provider) {
            return null
        }

        const durationOfCliff = countTime(values.cliffTime, values.type)
        const durationTime = countTime(values.vestTime, values.type)
        const periodTime = Math.round(durationTime/values.vestTime)
        console.log("durationOfCliff: ", durationOfCliff)
        console.log("durationTime: ", durationTime)
        console.log("period time: ", periodTime)
        const signer = web3Provider.getSigner();
        console.log("web3Provider: ", web3Provider)
        const vestingContract = new ethers.Contract(vestingAddress,Vesting.abi, signer)
        // string memory name,
        // uint256 vestTime,
        // uint256 cliffTime,
        // uint256 durationTime,
        // uint256 periodTime,
        // address tokenAddress
        console.log(1)
        const object  = {
            1: values.name, 
            2: values.vestTime, 
            3: durationOfCliff, 
            4: durationTime,
            5: periodTime,
            6: values.tokenAddress
        }
        console.log("values: ", object)
        const id = ethers.BigNumber.from(1)
        const schemeValue = await vestingContract.getSchemeInforById(id)
        console.log("schemeValues: ", schemeValue)
        const transaction = await vestingContract.newSchemeInformation(
            values.name, 
            values.vestTime, 
            durationOfCliff, 
            durationTime,
            periodTime,
            values.tokenAddress)
        const txData = await transaction.wait()
        console.log("transaction: ", transaction)
        console.log(txData)
        for (let i = 0; i < txData.events.length; i ++) {
            const event = txData.events[i]
            console.log("return event "+ i + ": ",event)
        }
    }

    const handlerSubmitVesting = async (values) => {
        if(!web3Provider) {
            return null
        }
        let amountDeposit = 0
        console.log("web3provider: ",web3Provider)
        const signer = web3Provider.getSigner();
        const vestingContract = new ethers.Contract(vestingAddress,Vesting.abi, signer)
        const transaction = await vestingContract.newSchemeInformation(
            values.wallet, 
            values.totalAmount, 
            amountDeposit, 
            values.totalClaimed,
            values.schemeId,
            values.startTime)
        const txData = await transaction.wait()
        console.log("transaction: ", transaction)
        console.log(txData)
        const event = txData.events[3]
        console.log("return event "+ 3 + ": ",event)
    }

    return(
        <>
        <Navbar web3Provider={web3Provider} provider={provider} isLoading={loadToken}/>
    
        <div className='text-center mt-8'>
            <button
                className="btn btn-light"
                onClick={(event) => {
                    setIsSell(false)
                    formik.setFieldValue('name',"")
                    formik.setFieldValue('vestTime',0)
                    formik.setFieldValue('cliffTime',0)
                    formik.setFieldValue('durationTime',"")
                    formik.setFieldValue('periodTime',0)
                    formik.setFieldValue('type',0)
                    formik.setFieldValue('tokenAddress',tokenAddress)
                }}
                >
                scheme
            </button>
            <span className="text-muted">&lt; &nbsp; &gt;</span>
            <button
                className="btn btn-light"
                onClick={(event) => {
                    setIsSell(true)
                    formik.setFieldValue('amount1',0)
                    formik.setFieldValue('amount2',0)
                }}
                >
                vesting
            </button>
        </div>
        <div className="w-full max-w-xs justify-center flex m-auto">
        
            {!isSell ? 
            <form 
                onSubmit={schemeFormik.handleSubmit}
                className="bg-white mt-5 px-8 pt-6 pb-8 mb-4 rounded border"
            >
                
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="eth">
                        Name
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        name="name"
                        id="name"
                        placeholder="name"
                        onChange={schemeFormik.handleChange}
                        onBlur={schemeFormik.handleBlur}
                        value={schemeFormik.values.name}
                    />
                    {schemeFormik.errors.name && schemeFormik.touched.name && (
                        <p className="error-message">{schemeFormik.errors.name}</p>
                    )}
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tokenAddress">
                        Token
                    </label>
                    <select className="form-select appearance-none
                        block
                        w-full
                        px-3
                        py-1.5
                        text-base
                        font-normal
                        text-gray-700
                        bg-white bg-clip-padding bg-no-repeat
                        border border-solid border-gray-300
                        rounded
                        transition
                        ease-in-out
                        m-0
                        focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                        name="tokenAddress" id="tokenAddress" value={schemeFormik.values.tokenAddress}
                        onChange={schemeFormik.handleChange}
                        onBlur={schemeFormik.handleBlur}
                        >
                            <option defaultValue>Open this select menu</option>
                            <option value={tokenAddress}>DTK</option>
                        </select>
                    {schemeFormik.errors.tokenAddress && schemeFormik.touched.tokenAddress && (
                        <p className="error-message">{schemeFormik.errors.tokenAddress}</p>
                    )}
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="vest-time">
                        Vest time
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        name="vestTime"
                        id="vest-time"
                        placeholder="vestTime"
                        onChange={schemeFormik.handleChange}
                        onBlur={schemeFormik.handleBlur}
                        value={schemeFormik.values.vestTime}
                    />
                    {schemeFormik.errors.vestTime && schemeFormik.touched.vestTime && (
                        <p className="error-message">{schemeFormik.errors.vestTime}</p>
                    )}
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="vest-time">
                        cliff time
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        name="cliffTime"
                        id="cliff-time"
                        placeholder="cliffTime"
                        onChange={schemeFormik.handleChange}
                        onBlur={schemeFormik.handleBlur}
                        value={schemeFormik.values.cliffTime}
                    />
                    {schemeFormik.errors.cliffTime && schemeFormik.touched.cliffTime && (
                        <p className="error-message">{schemeFormik.errors.cliffTime}</p>
                    )}
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">
                        type
                    </label>
                    <select className="form-select appearance-none
                        block
                        w-full
                        px-3
                        py-1.5
                        text-base
                        font-normal
                        text-gray-700
                        bg-white bg-clip-padding bg-no-repeat
                        border border-solid border-gray-300
                        rounded
                        transition
                        ease-in-out
                        m-0
                        focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none" aria-label="Default select example"
                        name="type" id="type" value={schemeFormik.values.type}
                        onChange={schemeFormik.handleChange}
                        onBlur={schemeFormik.handleBlur}
                        >
                            <option defaultValue>Open this select menu</option>
                            <option value={0}>week</option>
                            <option value={1}>month</option>
                        </select>
                    {schemeFormik.errors.type && schemeFormik.touched.type && (
                        <p className="error-message">{schemeFormik.errors.type}</p>
                    )}
                </div>
                    <button 
                        type="submit" 
                        disabled={schemeFormik.isSubmitting}
                        className="font-bold mt-4 bg-gray-500 text-white rounded p-4 shadow-lg">
                        Create scheme
                    </button>
                </form>
            
                :
                <form 
                    onSubmit={vestFormik.handleSubmit}
                    className="bg-white mt-5 px-8 pt-6 pb-8 mb-4 rounded border"
                >
                    {/* <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="eth">
                            DTK
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            type="number"
                            name="amount3"
                            id="eth"
                            placeholder="eth"
                            onChange={vestFormik.handleChange}
                            onBlur={vestFormik.handleBlur}
                            value={vestFormik.values.amount3}
                        />
                        {vestFormik.errors.amamount3ount1 && vestFormik.touched.amount3 && (
                            <p className="error-message">{vestFormik.errors.amount3}</p>
                        )}
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="add">
                            Address
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            type="text"
                            name="address"
                            id="add"
                            placeholder="input address"
                            value={vestFormik.values.address}
                            onChange={vestFormik.handleChange}
                            onBlur={vestFormik.handleBlur}
                        />
                        {vestFormik.errors.address && vestFormik.touched.address && (
                            <p className="error-message">{vestFormik.errors.address}</p>
                        )}
                    </div>
                    <button 
                        type="submit"
                        disabled={vestFormik.isSubmitting}
                        className="font-bold mt-4 bg-gray-500 text-white rounded p-4 shadow-lg">
                        Create vesting
                    </button> */}
                </form>
            
            }
            
        </div>
        </>
    )

}