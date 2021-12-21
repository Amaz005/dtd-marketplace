import {useFormik} from 'formik'
import * as Yup from 'yup'
import { ethers } from 'ethers'
import Web3Modal from 'web3modal'
import {walletAddress, tokenContract} from '../config'
import Swap from '../artifacts/contracts/Swap.sol/Swap.json'
import DToken from '../artifacts/contracts/Swap.sol/Swap.json'

export default function SwapToken (){
    
    const buyToken = async(values) => {
        const web3modal = new Web3Modal()
        const connection = await web3modal.connect()
        console.log("connection",connection)
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()

        const swapContract = new ethers.Contract(walletAddress, Swap.abi, signer)
        const amount = ethers.utils.parseUnits(values.amount1, 'wei')
        console.log("amount", amount)
        let transaction = await swapContract.buyToken({value: amount})
        let tx = await transaction.wait()
        let data = tx.events[0]
        console.log(data)
    }
    const formik = useFormik({
        initialValues: {amount1: 0, amount2:0},
        validationSchema: Yup.object({}),
        onSubmit: async (values, setSubmitings) => {
            await buyToken(values)
            setSubmitings(false)
        },

    })

    const handleSchemaChange = (e, setFieldValue) => {
        setFieldValue('amount1', e.target.value)
        setFieldValue('amount2', e.target.value * 1000)
    }

    return (
        <div className="w-full max-w-xs justify-center flex m-auto">
                <form 
                    onSubmit={formik.handleSubmit}
                    className="bg-white mt-10 px-8 pt-6 pb-8 mb-4 rounded border"
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
                            onChange={(e) => handleSchemaChange(e, formik.setFieldValue)}
                            onBlur={formik.handleBlur}
                            value={formik.values.amount1}
                        />
                        {formik.errors.amount1 && formik.touched.amount1 && (
                            <p className="error-message">{formik.errors.amount1}</p>
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
                            value={formik.values.amount2}
                        />
                        {formik.errors.amount2 && formik.touched.amount2 && (
                            <p className="error-message">{formik.errors.amount2}</p>
                        )}
                    </div>
                        <button 
                            type="submit" 
                            disabled={formik.isSubmitting}
                            className="font-bold mt-4 bg-gray-500 text-white rounded p-4 shadow-lg">
                            Swap token
                        </button>
                </form>
        </div>
    )
}