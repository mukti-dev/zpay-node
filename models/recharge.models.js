const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types
const RechargeSchema = new mongoose.Schema({

    transactionId: {
        type: String,
    },
    apiRechargeId: {
        type: String,
    },
    rechargeId: {
        type: String
    },
    userid: {
        type: ObjectId,
        required: true,
        minlength: 1,
        trim: true
    },
    mobile: {
        type: String,
        trim: true
    },
    amount: {
        type: Number,
    },
    cashback: {
        type: Number,
    },
    operator: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        minlength: 1,
        trim: true
    },
    errormessage: {
        type: String,
        default: 'N/A',
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    createdBy: {
        type: ObjectId,
        // required: true,
    },
    modifiedAt: {
        type: Date,
        default: Date.now()
    },
    modifiedBy: {
        type: ObjectId,
        required: true,
    },

})

const Recharge = mongoose.model('Recharge', RechargeSchema);

module.exports = { Recharge }