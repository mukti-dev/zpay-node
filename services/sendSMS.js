const axios = require('axios')
const otpConfig = require('../config/appConfig.json').OTP

const sendSMS_staticking = async (data) => {
    return new Promise((resolve, reject) => {
        let otpUrl = otpConfig.url
        console.log(otpUrl)
        const mobile = data.mobile
        const otp = data.otp
        otpUrl = otpUrl.replace('<mobile>', mobile)
        otpUrl = otpUrl.replace('<otp>', otp)
        axios.get(otpUrl)
            .then(function (response) {
                // handle success
                console.log(response);
            })
        resolve(otpUrl)
    })
}
module.exports = { sendSMS_staticking }