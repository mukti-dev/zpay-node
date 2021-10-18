const mongoose = require('mongoose');

const OperatorSchema = new mongoose.Schema({
    operatorName: {
        type: String,
        required: true,
        trim: true
    },
    operatorType: {
        type: String,
        required: true,
        trim: true
    },
    operatorCode: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    cashbackPercentageForZpay: {
        type: String,
        required: true,
        trim: true
    },
    cashbackPercentageForCustomer: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        required: true,
        minlength: 1,
        trim: true,
        default: 'Active'
    },

})

const Operator = mongoose.model('Operator', OperatorSchema);

module.exports = Operator