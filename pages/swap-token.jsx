import {useFormik} from 'formik'
import {useState} from 'react'
import * as Yup from 'yup'
import { ethers } from 'ethers'
import Web3Modal from 'web3modal'
import {walletAddress, tokenContract} from '../config'
import Swap from '../artifacts/contracts/Swap.sol/Swap.json'
import Navbar from '../components/Navbar.jsx'
import Alert from '../components/Alert.jsx'
import { useAlert } from 'react-alert'

export default function SwapToken (){
    const [loadToken, setLoadToken] = useState(false)
    const [isSell, setIsSell] = useState(false)
    const alert = useAlert()
    //@dev show popup
    const [show, setShow] = useState(false);
    const [message, setMessage] = useState('')
    const handleShow = (message) => {
        alert.error(message)
    }
    const handleHide = () => {
        console.log("handle hide from swap")
        setShow(false)
    }

    // @dev buy token
    const buyToken = async(values) => {
        const web3modal = new Web3Modal()
        const connection = await web3modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()
        
        const swapContract = new ethers.Contract(walletAddress, Swap.abi, signer)
        const amount = ethers.utils.parseUnits(values.amount1, 'wei')
        try {
            let transaction = await swapContract.buyToken({value: amount})
            let tx = await transaction.wait()
        } catch (err) {
            if(err.code == -32603) {
                handleShow(err.data.message)
            }
        }
        
        setLoadToken(true)
    }

    const transferToken = async(values) => {
        console.log('values: ',values)
        const web3modal = new Web3Modal()
        const connection = await web3modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()

        const swapContract = new ethers.Contract(walletAddress, Swap.abi, signer)
        const amount = ethers.utils.parseUnits(values.amount3.toString(), 'wei')
        const transaction = await swapContract.sellToken(amount, values.address)
        const tx = await transaction.wait()
        if(tx.code == -32603) {
            handleShow(tx.message)
        }
        setLoadToken(true)
    }

    const formikBuy = useFormik({
        initialValues: {amount1: 0, amount2:0},
        validationSchema: Yup.object({
            amount1: Yup.number()
                .min(0.01, "Mininum 0.01 number")
                .required("Required!"),
        }),
        onSubmit: async (values, setSubmitings) => {
            await buyToken(values)
        },
    })

    const formikTransfer = useFormik({
        initialValues: {amount3: 0, address: ""},
        validationSchema: Yup.object({
            amount3: Yup.number()
                .min(0.01, "Mininum 0.01 number")
                .required("Required!"),
        }),
        onSubmit: async (values, setSubmitings) => {
            await transferToken(values)
        },
    })

    const handleSchemaChange = (e, setFieldValue) => {
        setFieldValue('amount1', e.target.value)
        setFieldValue('amount2', e.target.value * 1000)
    }

    return (
        <>
        <Navbar dToken={loadToken}/>
        
        <Alert show={show} handleHidden={handleHide} message={message}/>
        <div className='text-center mt-8'>
            <button
                className="btn btn-light"
                onClick={(event) => {
                    setIsSell(false)
                    formik.setFieldValue('amount3',0)
                    formik.setFieldValue('address',"")
                }}
                >
                Buy
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
                Sell
            </button>
        </div>
        <div className="w-full max-w-xs justify-center flex m-auto">
        
            {!isSell ? 
            <form 
                onSubmit={formikBuy.handleSubmit}
                className="bg-white mt-5 px-8 pt-6 pb-8 mb-4 rounded border"
            >
                
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="eth">
                        ETH
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        type="number"
                        name="amount1"
                        id="eth"
                        placeholder="eth"
                        onChange={(e) => handleSchemaChange(e, formikBuy.setFieldValue)}
                        onBlur={formikBuy.handleBlur}
                        value={formikBuy.values.amount1}
                    />
                    {formikBuy.errors.amount1 && formikBuy.touched.amount1 && (
                        <p className="error-message">{formikBuy.errors.amount1}</p>
                    )}
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dtk">
                        DTK
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        type="number"
                        name="amount2"
                        id="dtk"
                        disabled
                        placeholder="DToken"
                        value={formikBuy.values.amount2}
                    />
                    {formikBuy.errors.amount2 && formikBuy.touched.amount2 && (
                        <p className="error-message">{formikBuy.errors.amount2}</p>
                    )}
                </div>
                    <button 
                        type="submit" 
                        disabled={formikBuy.isSubmitting}
                        className="font-bold mt-4 bg-gray-500 text-white rounded p-4 shadow-lg">
                        Swap token
                    </button>
                </form>
            
                :
                <form 
                    onSubmit={formikTransfer.handleSubmit}
                    className="bg-white mt-5 px-8 pt-6 pb-8 mb-4 rounded border"
                >
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="eth">
                            DTK
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            type="number"
                            name="amount3"
                            id="eth"
                            placeholder="eth"
                            onChange={formikTransfer.handleChange}
                            onBlur={formikTransfer.handleBlur}
                            value={formikTransfer.values.amount3}
                        />
                        {formikTransfer.errors.amamount3ount1 && formikTransfer.touched.amount3 && (
                            <p className="error-message">{formikTransfer.errors.amount3}</p>
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
                            value={formikTransfer.values.address}
                            onChange={formikTransfer.handleChange}
                            onBlur={formikTransfer.handleBlur}
                        />
                        {formikTransfer.errors.address && formikTransfer.touched.address && (
                            <p className="error-message">{formikTransfer.errors.address}</p>
                        )}
                    </div>
                    <button 
                        type="submit"
                        disabled={formikTransfer.isSubmitting}
                        className="font-bold mt-4 bg-gray-500 text-white rounded p-4 shadow-lg">
                        Transfer token
                    </button>
                </form>
            
            }
            
        </div>
        </>
    )
}