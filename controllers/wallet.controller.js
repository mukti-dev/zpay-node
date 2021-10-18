const { getWalletData, getWalletDetail, getAllWallet, addNewTransaction, getTodayWallet, addNewWallet, updateWalletBalance, rechargeTransactionManager, userWallet, razorpayRechargeTransactionManager } = require('../managers/wallet.manager')
const { getallRechargeData } = require('../managers/recharge.manager')
const { successResponse, failureResponse } = require('../services/responseGenerator')
const razorpayConfig = require('../config/appConfig.json').RAZOR_PAY
const zpayConfig = require('../config/appConfig.json').ZPAY
const Razorpay = require('razorpay');
const randomstring = require('randomstring')

const { narationText } = require('../services/narationText')

const walletHistory = async (req, res) => {
    try {
        console.log(req.params)
        const userId = req.params.userid
        const dateRange = req.body
        const walletData = await getWalletData(userId, dateRange)
        successResponse(req, res, walletData, 'Wallet data fetched successfully')
    } catch (error) {
        failureResponse(req, res, error)
    }

}

const walletDetail = async (req, res) => {
    try {
        const walletData = await getWalletDetail(req.params.walletid)
        successResponse(req, res, walletData, 'Wallet data fetched successfully')
    } catch (error) {
        failureResponse(req, res, error)
    }
}


const allWallet = async (req, res) => {
    try {
        let userId = req.params.userId
        const data = await getAllWallet(userId)
        // const data = await getallRechargeData()
        // console.log(data)

        successResponse(req, res, data, 'All Wallet data fetched successfully')
    } catch (error) {
        failureResponse(req, res, error)
    }
}

const todayWallet = async (req, res) => {
    try {
        let userId = req.params.userId
        const data = await getTodayWallet(userId)
        successResponse(req, res, data, 'All Wallet data fetched successfully')
    } catch (error) {
        failureResponse(req, res, error)
    }
}

const createOrder = (req, res) => {
    try {
        let amount = req.query.amount;

        let instance = new Razorpay({ key_id: razorpayConfig.key_id, key_secret: razorpayConfig.key_secret })

        let options = {
            amount: amount,  // amount in the smallest currency unit
            currency: "INR",
            receipt: "order_rcptid_12"
        };
        instance.orders.create(options, function (err, order) {
            if (err) {
                failureResponse(req, res, err)
            } else {
                successResponse(req, res, order, 'Order Generated')
            }

        });
    } catch (error) {
        failureResponse(req, res, error)
    }
}

const addMoney = async (req, res) => {
    try {
        let userid = req.body.userid;
        let amount = req.body.amount;
        let transactionid = req.body.transactionid;
        let status = req.body.status;
        let devSource = req.body.devSource;

        let newTransaction = {
            userId: userid,
            amount: amount,
            transactionid: transactionid,
            status: status,
            createdBy: userid,
            modifiedBy: userid,
        }

        const addTransaction = await addNewTransaction(newTransaction)
        let wallet = {
            userid: userid,
            credit: amount,
            status: status,
            transactionid: addTransaction._id,
            transactionSource: devSource,
            source: 'pg',
            naration: narationText(null, 'RRT_wallet_credit'),
            createdBy: userid,
            modifiedBy: userid
        }
        const addWallet = await addNewWallet(wallet)
        const updateWallet = await updateWalletBalance(userid, amount)
        successResponse(req, res, updateWallet, 'Money Added')
    } catch (error) {
        failureResponse(req, res, error)
    }
}
const addWallet = async (req, res) => {
    try {
        console.log(req.body)
        let userid = req.body.userselectid;
        let credit = req.body.credit || 0;
        let debit = req.body.debit || 0;
        let status = 'Success';
        let naration = req.body.naration
        let transactionid = randomstring.generate({
            length: 12,
            charset: 'numeric'
        });
        let amount = 0
        if (parseFloat(debit) > 0) {
            debit = parseFloat(debit)
        }
        if (parseFloat(credit) > 0) {
            credit = parseFloat(credit)
        }
        amount = credit + debit

        let newTransaction = {
            userId: userid,
            amount: amount,
            transactionid: transactionid,
            status: status,
            createdBy: userid,
            modifiedBy: userid,
        }

        const addTransaction = await addNewTransaction(newTransaction)

        let wallet = {
            userid: userid,
            credit: credit,
            debit: debit,
            status: status,
            transactionid: addTransaction._id,
            transactionSource: 'web',
            source: 'web_admin',
            naration: naration + '(TxnId: <txn_id>)',
            createdBy: userid,
            modifiedBy: userid
        }
        const addWallet = await addNewWallet(wallet)
        const updateWallet = await updateWalletBalance(userid, amount)
        successResponse(req, res, updateWallet, 'Wallet updated')
    } catch (error) {
        failureResponse(req, res, error)
    }
}
const addWalletByAdmin = async (req, res) => {
    try {

        let userid = req.body.userselectid;
        let credit = 0;
        let debit = 0;
        let naration
        if (req.body.type == 'credit') {
            credit = req.body.amount
            naration = narationText(null, 'admin_wallet_credit')
        }
        if (req.body.type == 'debit') {
            debit = req.body.amount
            naration = narationText(null, 'admin_wallet_debit')
        }
        let status = 'Success';
        let transactionid = randomstring.generate({
            length: 12,
            charset: 'numeric'
        });
        let amount = 0
        if (parseFloat(debit) > 0) {
            debit = parseFloat(debit)
        }
        if (parseFloat(credit) > 0) {
            credit = parseFloat(credit)
        }
        amount = credit + debit

        let newTransaction = {
            userId: userid,
            amount: amount,
            transactionid: transactionid,
            status: status,
            createdBy: req.user._id,
            modifiedBy: req.user._id,
        }
        const addTransaction = await addNewTransaction(newTransaction)

        let wallet = {
            userid: userid,
            credit: credit,
            debit: debit,
            status: status,
            transactionid: addTransaction._id,
            transactionSource: 'web',
            source: 'web_admin',
            naration: naration,
            createdBy: req.user._id,
            modifiedBy: req.user._id
        }
        const addWallet = await addNewWallet(wallet)
        const updateWallet = await updateWalletBalance(userid, amount)
        successResponse(req, res, updateWallet, 'User Wallet updated')
    } catch (error) {
        failureResponse(req, res, error)
    }
}

const rechargeTransaction = async (req, res) => {
    try {
        let data = {}
        data.userid = req.body.userid;
        data.name = req.body.name;
        data.phone = req.body.phone;
        data.amount = req.body.amount;
        data.cashback = req.body.cashback;
        data.tokenid = zpayConfig.tokenId;
        data.userid1 = zpayConfig.userId;
        data.optcode = req.body.optcode;
        data.state = req.body.state;
        data.devSource = req.body.devSource;

        // const wallet = await userWallet(data)
        const wallet = await rechargeTransactionManager(data)
        successResponse(req, res, wallet, 'Successful')
    } catch (error) {
        failureResponse(req, res, error)
    }
}

const razorpayRechargeTransaction = async (req, res) => {
    try {

        let data = {}
        data.userid = req.body.userid;
        data.name = req.body.name;
        data.phone = req.body.phone;
        data.amount = req.body.amount;
        data.cashback = req.body.cashback;
        data.transactionid = req.query.transactionid;
        data.tokenid = zpayConfig.tokenId;
        data.userid1 = zpayConfig.userId;
        data.optcode = req.body.optcode;
        data.state = req.body.state;
        data.devSource = req.body.devSource;

        const wallet = await razorpayRechargeTransactionManager(data)
        successResponse(req, res, wallet, 'Successful')
    } catch (error) {
        failureResponse(req, res, error)
    }
}

module.exports = { walletHistory, walletDetail, allWallet, todayWallet, createOrder, addMoney, rechargeTransaction, razorpayRechargeTransaction, addWallet, addWalletByAdmin }