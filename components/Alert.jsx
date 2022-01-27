import * as React from "react";
import InfoIcon from "../public/icons/InfoIcon";
import SuccessIcon from "../public/icons/SuccessIcon";
import ErrorIcon from "../public/icons/ErrorIcon";
import CloseIcon from "../public/icons/CloseIcon";
import { AlertComponentPropsWithStyle } from "react-alert";

const buttonStyle = {
    marginLeft: "20px",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    color: "#FFFFFF",
};


const Alert = (props) => {
    const { style, options, message, close } = props
    if (!options) {
        return <></>;
    }
    switch (options.type) {
        case "info":
        return (
            <div
            style={{...style }}
            className="bg-blue-100 border-t-4 border-blue-500 rounded-b text-blue-900 px-4 py-3 shadow-md"
            role="alert"
            >
            <div className="flex">
                <div className="py-1">
                <InfoIcon />
                </div>
                <div>
                <p className="font-bold">Info!</p>
                <p className="text-sm">{message}</p>
                </div>
            <button onClick={close} style={buttonStyle}>
                <CloseIcon />
            </button>
            </div>
            </div>
        );
        case "success":
        return (
            <div
            style={{...style }}
            className="bg-green-100 border-t-4 border-green-500 rounded-b text-green-900 px-4 py-3 shadow-md"
            role="alert"
            >
            <div className="flex">
                <div className="py-1">
                <SuccessIcon />
                </div>
                <div>
                <p className="font-bold">SUCCESS!</p>
                <p className="text-sm">{message}</p>
                </div>
            <button onClick={close} style={buttonStyle}>
                <CloseIcon />
            </button>
            </div>
            </div>
        );
        case "error":
        return (
            <div
            style={{...style }}
            className="bg-red-100 border-t-4 border-red-500 rounded-b text-red-900 px-4 py-3 shadow-md"
            role="alert"
            >
            <div className="flex">
                <div className="py-1">
                    <ErrorIcon />
                </div>
                <div>
                    <p className="font-bold">ERROR</p>
                    <p className="text-sm">{message}</p>
                </div>
                <button onClick={close} style={buttonStyle}>
                    <CloseIcon />
                </button>
            </div>
            </div>
        )
        default :
            return (<></>)
    }
};

export default Alert;
