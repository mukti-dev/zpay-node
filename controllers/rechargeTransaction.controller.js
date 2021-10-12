const { successResponse, failureResponse } = require('../services/responseGenerator')
const { rechargeTransactionManager, razorpayRechargeTransactionManager, updatePendingRechargeManager } = require('../managers/rechargeTransaction.manager')
const zpayConfig = require('../config/appConfig.json').ZPAY

const rechargeTransaction = async (req, res) => {
    try {
        let data = {}
        data.userid = req.body.userid;
        data.phone = req.body.phone;
        data.amount = req.body.amount;
        data.cashback = req.body.cashback;
        data.tokenid = zpayConfig.tokenId;
        data.userid1 = zpayConfig.userId;
        data.optcode = req.body.optcode;
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

const updatePendingRecharge = async (req, res) => {

    try {
        let rechargeStatusData = req.query
        const update = await updatePendingRechargeManager(rechargeStatusData)
        successResponse(req, res, update, 'Successful')
    } catch (error) {
        failureResponse(req, res, error)
    }

}

module.exports = { rechargeTransaction, razorpayRechargeTransaction, updatePendingRecharge }