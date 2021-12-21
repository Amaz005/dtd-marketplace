import React from "react"
import Image from "next/image"

function Repeat(props) {
    let items = [];
    for (let i = 0; i < props.numTimes; i++) {
        items.push(i);
    }
    return items.map((item,i) => (
        <div key={i} className="border shadow rounded-xl">   

            <div className="h-40 bg-gray-200 rounded-tr rounded-tl animate-pulse"></div>

            <div className="p-5">
                <div className="h-6 rounded-sm bg-gray-200 animate-pulse mb-4"></div>

                <div className="grid grid-cols-4 gap-1">
                <div className="col-span-3 h-4 rounded-sm bg-gray-200 animate-pulse"></div>
                <div className="h-4 rounded-sm bg-gray-200 animate-pulse"></div>

                <div className="col-span-2 h-4 rounded-sm bg-gray-200 animate-pulse"></div>
                <div className="col-span-2 h-4 rounded-sm bg-gray-200 animate-pulse"></div>
                </div>

            </div>

            </div>
    ))
}

function Loading(props) {
    return (
        <div className={props.loading ? "block" : "hidden"}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 px-4">

                <Repeat numTimes={12}/>
                
            </div>
        </div>
    );
}

export default Loading;