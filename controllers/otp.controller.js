const { saveUserData } = require("../managers/user.manager")
const { successResponse, failureResponse } = require('../services/responseGenerator')
const { createOtp, matchOtp, otpUserLogin, changePasswordByOTP } = require('../managers/otp.manager')
const { generateJwtToken } = require("../services/jwt")

const registerUser = async (req, res) => {
    try {
        req.body.isActive = false
        let otpData = {}
        otpData.otpFor = "register"
        let newUser = await saveUserData(req.body)
        otpData.mobile = newUser.phone
        const result = await createOtp(newUser._id, otpData)
        successResponse(req, res, result, 'OTP sent successfully')
    } catch (error) {
        failureResponse(req, res, error)
    }

}

const loginUser = async (req, res) => {
    try {
        let user = await otpUserLogin(req.body)
        let otpData = {}
        otpData.otpFor = "login"
        otpData.userInfo = req.body
        otpData.mobile = user.phone
        const result = await createOtp(user._id, otpData)

        successResponse(req, res, result, 'OTP sent successfully')
    } catch (error) {
        failureResponse(req, res, error)
    }
}

const verifyOtp = async (req, res) => {
    try {
        let result = await matchOtp(req.body)
        let authToken = await generateJwtToken(result)
        result.authToken = authToken
        successResponse(req, res, result, 'OTP verified successfully')
    } catch (error) {
        failureResponse(req, res, error)
    }
}

const changePassword = async (req, res) => {
    try {
        let user = await changePasswordByOTP(req.body)
        let otpData = {}
        otpData.otpFor = "changePassword"
        otpData.password = req.body.newPassword
        otpData.mobile = user.phone
        const result = await createOtp(user._id, otpData)
        successResponse(req, res, result, 'OTP sent successfully')
    } catch (error) {
        failureResponse(req, res, error)
    }
}


module.exports = { registerUser, loginUser, changePassword, verifyOtp }