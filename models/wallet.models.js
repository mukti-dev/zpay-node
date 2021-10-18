const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types
const WalletSchema = new mongoose.Schema({
    userid: {
        type: ObjectId,
        required: true,
        minlength: 1,
        trim: true
    },
    debit: {
        type: Number,
        default: 0
    },
    credit: {
        type: Number,
        default: 0
    },
    restAmount: {
        type: Number,
        default: 0
    },
    naration: {
        type: String,
        minlength: 1,
        trim: true
    },
    rechargeId: {
        type: ObjectId
    },
    transactionid: {
        type: String,
    },
    source: {
        type: String,
    },
    transactionSource: {
        type: String,
    },
    status: {
        type: String,
        minlength: 1,
        trim: true
    },

    operator: {
        type: String,
    },
    service: {
        type: String,
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
WalletSchema.pre("updateOne", async function (next) {
    let record = this
    delete record._update.createdBy
    record._update.modifiedAt = Date.now()
    console.log(record._update)
    next()
})
const Wallet = mongoose.model('Wallet', WalletSchema);

module.exports = { Wallet }