import {useFormik} from 'formik'
import * as Yup from 'yup'
import {useAlert} from 'react-alert'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import {ethers} from 'ethers'
import { Portal } from 'react-overlays'
import '../styles/sellAsset.module.css'
import { nftMarketAddress, nftAddress } from '../config'
import Market from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json"

const CalendarContainer = ({children}) => {
    const el = document.getElementById('calendar-portal')

    return (
        <Portal container={el}>
        {children}
        </Portal>
    )
}

const Modal = ({ handleClose, show, value, connection }) => {
    const alert = useAlert()
    const buyNFT = async (values) => {
        // @dev get web3 provider info
        if(!connection) {
            return null
        }
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()
        const signature = signer.signMessage()
        
        // get NFTmarket contract
        const contract = new ethers.Contract(nftMarketAddress, Market.abi, signer)
        const priceStep = ethers.utils.parseUnits(values.priceStep.toString(), 'wei')
        const timestamp = parseInt(values.endTime.getTime()/1000);
        const endTime = ethers.utils.parseUnits(timestamp.toString(), 'wei')
        const lowestPrice = ethers.utils.parseUnits(values.lowestPrice.toString(), 'wei')
        try {
            const transaction = await contract.createMarketItem(nftAddress, value.tokenId, priceStep, endTime, lowestPrice)
            const tx = await transaction.wait()
            if(tx) {
                console.log(tx)
            }
            handleClose()
        } catch (error) {
            alert.error(error.data.message)
        }
        
    }
    const formik = useFormik(
        {
            initialValues: {priceStep: 0, endTime: new Date(), lowestPrice: 0},
            validationSchema: Yup.object({
                priceStep: Yup.number()
                    .min(0.01, "Mininum 0.01 number")
                    .required("Required!"),
                endTime: Yup.date()
                    .required("Required!"),
                lowestPrice: Yup.date()
                    .min(0.01, "Mininum 0.01 number")
                    .required("Required!"),
            }),
            onSubmit:async (values) => {
                await buyNFT(values)
            }
        }
    )

    return (
        <>
        {show ?
            (<div className="fixed z-10 inset-0 overflow-y-auto " aria-labelledby="modal-title" role="dialog" aria-modal="true">
                <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
                
                    <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                    
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                        <form onSubmit={formik.handleSubmit}>
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div >
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left ">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                            Form input
                                        </h3>
                                        <div className="grid grid-rows-2 grid-flow-col gap-4">
                                            <div className="mt-2">
                                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="endTime">
                                                    End time
                                                </label>
                                                <DatePicker
                                                    className="shadow appearance-none border rounded mb-2 w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                    id="endTime"
                                                    showTimeSelect
                                                    timeFormat="HH:mm"
                                                    minDate={new Date()}
                                                    dateFormat="dd/mm/yyyy HH:mm"
                                                    popperContainer={CalendarContainer}
                                                    selected={formik.values.endTime}
                                                    onChange={val => {
                                                        formik.setFieldValue("endTime", val);
                                                    }}
                                                />
                                                {formik.errors.endTime && formik.touched.endTime && (
                                                    <p className="error-message">{formik.errors.endTime}</p>
                                                )}
                                            </div>
                                            <div className="mt-2">
                                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="priceStep">
                                                    Price step
                                                </label>
                                                <input 
                                                    className="shadow appearance-none border rounded mb-2 w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                    type="number"
                                                    id="priceStep"
                                                    name="priceStep"
                                                    placeholder="price step"
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    value={formik.values.priceStep}
                                                />
                                                {formik.errors.priceStep && formik.touched.priceStep && (
                                                    <p className="error-message">{formik.errors.priceStep}</p>
                                                )}
                                            </div>
                                            <div className="mt-2">
                                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lowestPrice">
                                                    Lowest price
                                                </label>
                                                <input 
                                                    className="shadow appearance-none border rounded mb-2 w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                    type="number"
                                                    id="lowestPrice"
                                                    name="lowestPrice"
                                                    placeholder="Lowest price"
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    value={formik.values.lowestPrice}
                                                />
                                                {formik.errors.lowestPrice && formik.touched.lowestPrice && (
                                                    <p className="error-message">{formik.errors.lowestPrice}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse text-center">
                                <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm">
                                    Save
                                </button>
                                <button type="button" onClick={handleClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>)
        : null }
        </>
    );
};

export default Modal