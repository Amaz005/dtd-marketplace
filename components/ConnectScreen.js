import styles from '../styles/CreateAsset.module.css'
import Modal from './Modal'
import {useState} from 'react'

const ConnectScreen = () => {
    const [show, setShow] = useState(false);

    const handleShow = () => {
        setShow(true)
    }
    const handleHide = () => {
        setShow(false)
    }
    return (
        <div className="flex justify-center items-center h-70s">
            <Modal show={show} handleClose={handleHide}></Modal>
            <button id="connect-button"  className={styles.connectButton} onClick={handleShow}>Connect Wallet</button>
        </div>
    )
}
export default ConnectScreen;