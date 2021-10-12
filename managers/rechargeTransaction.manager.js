const { Wallet } = require('../models/wallet.models')
const { ObjectId } = require('mongoose').Types
const axios = require('axios')
const uuid = require('uuid')
const { Recharge } = require('../models/recharge.models')
const { UpgradeRequiredError, InternalServerError } = require('../_errorHandler/error')
const { addRechargeManager } = require('./recharge.manager')
const { narationText } = require('../services/narationText')
const { addNewWallet } = require('./wallet.manager')

const rechargeTransactionManager = async (reqBody) => {
    try {
        let userid = reqBody.userid
        let phone = reqBody.phone
        let amount = reqBody.amount
        let cashback = reqBody.cashback
        let tokenid = reqBody.tokenid
        let userid1 = reqBody.userid1
        let optcode = reqBody.optcode
        let devSource = reqBody.devSource

        let wallet = await Wallet.aggregate([{ $match: { userid: new ObjectId(userid) } }, { $group: { _id: "$userid", creditsum: { $sum: "$credit" }, debitsum: { $sum: "$debit" } } }]).exec()
        console.log(wallet)

        let bal = 0
        if (wallet.length > 0) {
            bal = wallet[0].creditsum - wallet[0].debitsum;
        }
        const rchId = uuid.v4()

        if (bal >= amount) {
            return new Promise(async (resolve, reject) => {
                let post_data = JSON.stringify({
                    "Customernumber": phone,
                    "Tokenid": tokenid,
                    "Userid": userid1,
                    "Amount": amount,
                    "Optcode": optcode,
                    "Yourrchid": rchId,
                });

                let config = {
                    method: 'post',
                    url: 'https://www.zpay.co.in/Recharge/Recharge',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: post_data
                };

                axios(config).then(async (response) => {
                    console.log(response.data)
                    const recharge = {
                        transactionId: response.data.Transid,
                        rechargeId: response.data.Yourrchid,
                        apiRechargeId: response.data.RechargeID,
                        userid: userid,
                        mobile: phone,
                        amount: amount,
                        cashback: cashback,
                        operator: optcode,
                        status: response.data.Status,
                        createdBy: userid,
                        modifiedBy: userid,
                    }
                    const addRecharge = await addRechargeManager(recharge)
                    if (parseFloat(amount) > 0) {
                        const narationObj = { phone, Transid: response.data.Transid }
                        let newWallet = {
                            userid: userid,
                            debit: amount,
                            operator: optcode,
                            rechargeId: addRecharge._id,
                            transactionSource: devSource,
                            source: 'recharge',
                            naration: narationText(narationObj, 'RT_wallet_debit'),
                            status: response.data.Status,
                            createdBy: userid,
                            modifiedBy: userid
                        };
                        await addNewWallet(newWallet)
                    }
                    if (response.data.Status == 'Success') {

                        if (parseFloat(cashback) > 0) {
                            const narationObj = { phone, RechargeID: response.data.RechargeID, Transid: response.data.Transid }
                            let newWallet = {
                                userid: userid,
                                credit: cashback,
                                operator: optcode,
                                rechargeId: addRecharge._id,
                                transactionSource: devSource,
                                source: 'cashback',
                                naration: narationText(narationObj, 'RT_cashback'), Transid,
                                status: response.data.Status,
                                createdBy: userid,
                                modifiedBy: userid
                            };
                            await addNewWallet(newWallet)
                        }
                        const userData = await getUserById(userid)
                        resolve(userData)

                    } else if (response.data.Status == 'Failed') {
                        const narationObj = { phone }

                        let newWallet = {
                            userid: userid,
                            credit: amount,
                            rechargeId: addRecharge._id,
                            operator: optcode,
                            transactionSource: devSource,
                            naration: narationText(narationObj, 'RT_failed_wallet_refund'),
                            status: response.data.Status,
                            errormessage: response.data.Errormsg,
                            source: 'refund',
                            createdBy: userid,
                            modifiedBy: userid
                        };
                        await addNewWallet(newWallet)
                        reject(new InternalServerError(`Transaction failed due to ${response.data.Errormsg} and deducted amount is refunded`))
                    } else if (response.data.Status == 'Pending') {
                        reject(new InternalServerError(`Recharge is pending : ${response.data.Errormsg}. We will update the status once it is complete`))
                    } else {
                        reject(new InternalServerError('Unknown response from zpay client'))
                    }
                }).catch((error) => {
                    console.log(error)
                    throw error
                })
            })

        } else {
            throw new UpgradeRequiredError("Low Balance.")
        }
    } catch (error) {
        throw error
    }

}

const razorpayRechargeTransactionManager = async (reqBody) => {
    try {
        let userid = reqBody.userid
        let amount = reqBody.amount
        let transactionid = reqBody.transactionid
        let optcode = reqBody.optcode
        let devSource = reqBody.devSource


        let newTransaction = {
            userId: userid,
            amount: amount,
            transactionid: transactionid,
            status: 'Success',
            createdBy: userid,
            modifiedBy: userid,
        }
        const addTransactionBeforeRecharge = await addNewTransaction(newTransaction)
        let addWalletbeforeRecarge = new Wallet({
            userid: userid,
            credit: amount,
            status: 'Success',
            transactionid: addTransactionBeforeRecharge._id,
            transactionSource: devSource,
            source: 'pg',
            naration: narationText(null, 'RRT_wallet_credit'),
            createdBy: userid,
            modifiedBy: userid
        })

        await addNewWallet(addWalletbeforeRecarge)
        await updateWalletBalance(userid, amount)
        const recharged = await rechargeTransaction(reqBody)
        return recharged
    } catch (error) {
        throw error
    }
}

const updatePendingRechargeManager = async (reqBody) => {
    let recharge = Recharge.findOne({ rechargeId: reqBody.rchId }).exec()
    if (recharge && recharge !== null) {
        recharge = JSON.parse(JSON.stringify(recharge))
    } else {
        throw new InternalServerError('No data found with rchid')
    }
    let cashback = recharge.cashback || 0

    if (reqBody.Status == 'Success') {
        if (parseFloat(cashback) > 0) {
            const narationObj = { phone, RechargeID: response.data.RechargeID, Transid: response.data.Transid }
            let newWallet = {
                userid: userid,
                credit: cashback,
                operator: optcode,
                rechargeId: addRecharge._id,
                transactionSource: devSource,
                source: 'cashback',
                naration: narationText(narationObj, 'RT_cashback'), Transid,
                status: response.data.Status,
                createdBy: userid,
                modifiedBy: userid
            };
            await addNewWallet(newWallet)
        }
        const userData = await getUserById(userid)
        return userData
    }
    else if (reqBody.Status == 'Failed') {
        const narationObj = { phone }
        let newWallet = {
            userid: userid,
            credit: amount,
            rechargeId: addRecharge._id,
            operator: optcode,
            transactionSource: devSource,
            naration: narationText(narationObj, 'RT_failed_wallet_refund'),
            status: response.data.Status,
            errormessage: response.data.Errormsg,
            source: 'refund',
            createdBy: userid,
            modifiedBy: userid
        };
        await addNewWallet(newWallet)
        reject(new InternalServerError(`Transaction failed due to ${response.data.Errormsg} and deducted amount is refunded`))
    } else {
        reject(new InternalServerError('Unknown response from zpay client'))
    }

    await Recharge.updateOne({ rechargeId: reqBody.rchId }, { status: reqBody.Status })

}


module.exports = { rechargeTransactionManager, razorpayRechargeTransactionManager, updatePendingRechargeManager }
