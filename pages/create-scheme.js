import {ethers} from 'ethers';
import { useFormik } from 'formik';
import * as Yup from 'yup'
import {tokenAddress,vestingAddress} from '../config'
import {useEffect} from 'react'
import Vesting from '../artifacts/contracts/Vesting.sol/Vesting.json'

export default function createScheme({ provider, web3Provider}) {

    useEffect(() => {
        console.log("create-scheme-web3Provider: ", web3Provider)
    }, [])

    const formik = useFormik({
        initialValues: {
            name: "scheme 1",
            vestTime: 2,
            cliffTime: 2,
            durationTime: 100,
            periodTime: 25,
            tokenAddress: tokenAddress
        },
        // validationSchema: Yup.
    })

    const handlerSubmitScheme = async () => {
        if(!web3Provider) {
            return null
        }
        console.log("web3provider: ",web3Provider)
        const signer = web3Provider.getSigner();
        const vestingContract = new ethers.Contract(vestingAddress,Vesting.abi, signer)
        const scheme = {
            name: "scheme 1",
            vestTime: 2,
            cliffTime: 2,
            durationTime: 100,
            periodTime: 25,
            tokenAddress: tokenAddress
        }
        const transaction = await vestingContract.newSchemeInformation(
            scheme.name, 
            scheme.vestTime, 
            scheme.cliffTime, 
            scheme.durationTime,
            scheme.periodTime,
            scheme.tokenAddress)
        const txData = await transaction.wait()
        console.log("transaction: ", transaction)
        console.log(txData)
        for (let i = 0; i < txData.events.length; i ++) {
            const event = txData.events[i]
            console.log("return event "+ i + ": ",event)
        }
    }

    const handlerSubmitVesting = async () => {
        if(!web3Provider) {
            return null
        }
        console.log("web3provider: ",web3Provider)
        const signer = web3Provider.getSigner();
        const vestingContract = new ethers.Contract(vestingAddress,Vesting.abi, signer)
        const scheme = {
            name: "scheme 1",
            vestTime: 2,
            cliffTime: 2,
            durationTime: 100,
            periodTime: 25,
            tokenAddress: tokenAddress
        }
        const transaction = await vestingContract.newSchemeInformation(
            scheme.name, 
            scheme.vestTime, 
            scheme.cliffTime, 
            scheme.durationTime,
            scheme.periodTime,
            scheme.tokenAddress)
        const txData = await transaction.wait()
        console.log("transaction: ", transaction)
        console.log(txData)
        for (let i = 0; i < txData.events.length; i ++) {
            const event = txData.events[i]
            console.log("return event "+ i + ": ",event)
        }
    }

    return(
        <>
            <button onClick={handlerSubmitScheme}>create-scheme</button>
            <button onClick={handlerSubmitVesting}>create-vesting</button>
        </>
    )

}