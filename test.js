const countTime = (num) => {
    return num * (30*24*60*60*1000)
}
const timeStamp = () => {
    const startTime = parseInt((Date.now()/1000) - countTime(2))
    const cliffTime = parseInt(countTime(2))
    const now = parseInt(Date.now()/1000)
    console.log("startTime: ",parseInt((Date.now())/1000) )
    console.log("now - (startTime + cliffTime)/ countTime: ", 
    1000 * (now - (startTime)) / countTime(2))
}
timeStamp()