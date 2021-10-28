const randomstring = require('randomstring')
const { ObjectId } = require('mongoose').Types
const OtpModel = require('../models/otp.model')
const Users = require('../models/users.models')
const { Login } = require('../models/login.models')
const UnauthorizedError = require('../_errorHandler/401')
const BadRequestError = require('../_errorHandler/400')
const { encryptText, decryptText } = require('../helper/encryptDecrypt')
const { sendSMS_staticking } = require('../services/sendSMS')
const moment = require('moment')

const createOtp = async (userId, otpData) => {
    try {
        await OtpModel.deleteMany({ userId: ObjectId(userId) })
        const otpText = randomstring.generate({
            length: 6,
            charset: 'numeric'
        })
        const sendOtp = await sendSMS_staticking({
            mobile: otpData.mobile,
            otp: otpText
        })
        const newotpData = {
            userId: userId,
            otp: otpText,
            createdAt: new Date(),
            expiredAt: new Date(new Date().getTime() + 5 * 60000),
            otpFor: otpData.otpFor,
            userInfo: otpData.userInfo,
            password: otpData.password
        }

        const optSchemaData = new OtpModel(newotpData)
        const otp = await optSchemaData.save()
        return { otpId: otp._id, otpFor: otp.otpFor }
    } catch (error) {
        throw error
    }
}

const matchOtp = async (reqBody) => {
    try {
        let otpData = await OtpModel.findOne({ _id: ObjectId(reqBody.otpId), isActive: true, otpFor: reqBody.otpFor }).exec()
        if (otpData && otpData !== null) {
            let currentTime = new Date(moment())
            let expireTime = new Date(otpData.expiredAt)
            if (currentTime < expireTime) {
                if (reqBody.otp == otpData.otp) {
                    let result
                    if (reqBody.otpFor == "register") {
                        result = await Users.findOneAndUpdate({ _id: otpData.userId }, { isActive: true, updatedAt: new Date() }).exec();
                    } else if (reqBody.otpFor == 'changePassword') {
                        let pw = otpData.password
                        let password = await encryptText(pw)
                        result = await Users.findOneAndUpdate({ _id: otpData.userId }, { password: password, updatedAt: new Date() }).exec();

                    } else if (reqBody.otpFor == 'login') {
                        const loginDataFromOtp = otpData.userInfo
                        let user = await Users.findOne({ _id: otpData.userId, isActive: true }).exec();
                        let loginData = new Login({
                            userId: user._id,
                            ipAddress: loginDataFromOtp.ipAddress,
                            location: loginDataFromOtp.location,
                            deviceType: loginDataFromOtp.deviceType,
                            deviceToken: loginDataFromOtp.deviceToken,
                            macAddresss: loginDataFromOtp.macAddress,
                            logintime: new Date()
                        })

                        await Users.updateOne({ _id: new ObjectId(user._id) }, { deviceType: reqBody.deviceType, deviceToken: reqBody.deviceToken, updatedBy: ObjectId(user._id), updatedAt: new Date() })
                        await loginData.save()
                        result = JSON.parse(JSON.stringify(user))
                        result.deviceToken = loginDataFromOtp.deviceToken
                        result.deviceType = loginDataFromOtp.deviceType
                    } else {
                        throw new BadRequestError("OTP fro?")
                    }
                    await OtpModel.deleteOne({ _id: ObjectId(reqBody.otpId) })
                    result = JSON.parse(JSON.stringify(result))
                    delete result.password
                    delete result.isActive
                    delete result.__v
                    return result

                } else {
                    throw new UnauthorizedError("Wrong OTP")
                }
            } else {
                throw new UnauthorizedError("OTP expired")
            }
        } else {
            throw new BadRequestError("Invalid request")
        }
    } catch (error) {
        throw error
    }
}

const otpUserLogin = async (reqBody) => {
    let query = { $and: [{ $or: [{ email: reqBody.username }, { phone: reqBody.username }] }, { status: "Active" }, { isActive: true }] }
    const user = await Users.findOne(query).exec()
    if (user && user !== null) {
        return user
    } else {
        throw new UnauthorizedError("Invalid User")
    }

}
const changePasswordByOTP = async (reqBody) => {
    try {
        let query = {
            $and: [{ $or: [{ email: reqBody.username }, { phone: reqBody.username }] }, { status: "Active" }, { isActive: true }]
        }
        const user = await Users.findOne(query).exec()
        let isPwMatch = await decryptText(reqBody.oldPassword, user.password)
        if (!isPwMatch) {
            throw new UnauthorizedError("Old password not matched")
        }
        return user

    } catch (error) {
        throw error
    }

}

module.exports = { createOtp, matchOtp, otpUserLogin, changePasswordByOTP }