const { Schema, Types, model } = require('mongoose')
const { ObjectId } = Types

const otpSchema = new Schema({
    userId: {
        type: ObjectId,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true
    },
    expiredAt: {
        type: Date,
        required: true
    },
    otpFor: {
        type: String,
        required: true
    },
    password: {
        type: String
    },
    userInfo: {
        type: Object
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true
    }
})
const Otp = model('otp', otpSchema)
module.exports = Otp

