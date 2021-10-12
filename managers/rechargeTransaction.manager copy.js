const { Wallet } = require('../models/wallet.models')
const { ObjectId } = require('mongoose').Types
const Transaction = require('../models/transaction.models')
const axios = require('axios')
const { UpgradeRequiredError, InternalServerError } = require('../_errorHandler/error')

const rechargeTransactionManager = async (reqBody) => {
    try {
        let userid = reqBody.userid
        let name = reqBody.name
        let phone = reqBody.phone
        let amount = reqBody.amount
        let cashback = reqBody.cashback
        let tokenid = reqBody.tokenid
        let userid1 = reqBody.userid1
        let optcode = reqBody.optcode
        let state = reqBody.state
        let devSource = reqBody.devSource

        let wallet = await Wallet.aggregate([{ $match: { userid: new ObjectId(userid) } }, { $group: { _id: "$userid", creditsum: { $sum: "$credit" }, debitsum: { $sum: "$debit" } } }]).exec()
        console.log(wallet)

        let bal = 0
        if (wallet.length > 0) {
            bal = wallet[0].creditsum - wallet[0].debitsum;
        }
        console.log(bal)

        if (bal >= amount) {
            return new Promise(async (resolve, reject) => {
                let post_data = JSON.stringify({
                    "Customernumber": phone,
                    "Tokenid": tokenid,
                    "Userid": userid1,
                    "Amount": amount,
                    "Optcode": optcode,
                    "Yourrchid": "Your Recharge Unique Id",
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
                    if (response.data.Status == 'Success') {

                        const recharge = {
                            transactionId: response.data.Transid,
                            rechargeId: response.data.RechargeID,
                            userid: userid,
                            mobile: phone,
                            amount: amount,
                            operator: optcode,
                            status: response.data.Status,
                            createdBy: userid,
                            modifiedBy: userid,
                        }
                        const addRecharge = await addRechargeManager(recharge)

                        if (parseFloat(amount) > 0) {
                            let newWallet1 = {
                                userid: userid,
                                debit: amount,
                                operator: optcode,
                                rechargeId: addRecharge._id,
                                transactionSource: devSource,
                                naration: 'For RechargeId: ' + response.data.RechargeID + ', and TransactionId: ' + response.data.Transid,
                                status: response.data.Status,
                                createdBy: userid,
                                modifiedBy: userid
                            };
                            let addWalttet = await addNewWallet(newWallet1)
                        }
                        if (parseFloat(cashback) > 0) {
                            let newWallet1 = {
                                userid: userid,
                                credit: cashback,
                                operator: optcode,
                                rechargeId: addRecharge._id,
                                transactionSource: devSource,
                                naration: 'For RechargeId: ' + response.data.RechargeID + ', and TransactionId: ' + response.data.Transid,
                                status: response.data.Status,
                                createdBy: userid,
                                modifiedBy: userid
                            };
                            let addWalttet = await addNewWallet(newWallet1)
                        }



                        const userData = await getUserById(userid)

                        let walletBalance = userData.walletBalance;
                        let newWalletBalance = parseFloat(walletBalance) - parseFloat(amount) + parseFloat(cashback)


                        await Users.findOneAndUpdate({ _id: new ObjectId(userid) }, {
                            walletBalance: newWalletBalance,
                        }, {
                            new: true
                        }).then((user) => {

                            console.log(newWalletBalance)
                            // res.status(200).send(user);
                            resolve(user)

                        });

                    } else {
                        let recharge = {
                            transactionId: response.data.Transid,
                            rechargeId: response.data.RechargeID,
                            userid: userid,
                            mobile: phone,
                            amount: amount,
                            operator: optcode,
                            status: response.data.Status,
                            createdBy: userid,
                            errormessage: response.data.Errormsg,
                            modifiedBy: userid,
                        }
                        await addRechargeManager(recharge)

                        reject(new InternalServerError(response.data.Errormsg))
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
        let name = reqBody.name
        let phone = reqBody.phone
        let amount = reqBody.amount
        let cashback = reqBody.cashback
        let transactionid = reqBody.transactionid
        let tokenid = reqBody.tokenid
        let userid1 = reqBody.userid1
        let optcode = reqBody.optcode
        let state = reqBody.state
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
            naration: 'Add Money By PG of amount ' + amount + ' For recharge operator ' + optcode,
            createdBy: userid,
            modifiedBy: userid
        })

        await addNewWallet(addWalletbeforeRecarge)
        await updateWalletBalance(userid, amount)

        let wallet = await Wallet.aggregate([{ $match: { userid: new ObjectId(userid) } }, { $group: { _id: "$userid", creditsum: { $sum: "$credit" }, debitsum: { $sum: "$debit" } } }]).exec()
        let bal = 0
        if (wallet.length > 0) {
            bal = wallet[0].creditsum - wallet[0].debitsum;
        }

        if (bal >= amount) {
            return new Promise(async (resolve, reject) => {
                let post_data = JSON.stringify({
                    "Customernumber": phone,
                    "Tokenid": tokenid,
                    "Userid": userid1,
                    "Amount": amount,
                    "Optcode": optcode,
                    "Yourrchid": "Your Recharge Unique Id",
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
                    if (response.data.Status == 'Success') {


                        const recharge = {
                            transactionId: response.data.Transid,
                            rechargeId: response.data.RechargeID,
                            userid: userid,
                            mobile: phone,
                            amount: amount,
                            operator: optcode,
                            status: response.data.Status,
                            createdBy: userid,
                            modifiedBy: userid,
                        }
                        const addRecharge = await addRechargeManager(recharge)
                        if (parseFloat(amount) > 0) {
                            let newWallet1 = {
                                userid: userid,
                                debit: amount,
                                rechargeId: addRecharge._id,
                                operator: optcode,
                                transactionSource: devSource,
                                naration: 'For RechargeId: ' + response.data.RechargeID + ', and TransactionId: ' + response.data.Transid,
                                status: response.data.Status,
                                createdBy: userid,
                                modifiedBy: userid
                            };
                            let addWalttet = await addNewWallet(newWallet1)
                        }
                        if (parseFloat(cashback) > 0) {
                            let newWallet1 = {
                                userid: userid,
                                credit: cashback,
                                operator: optcode,
                                rechargeId: addRecharge._id,
                                transactionSource: devSource,
                                naration: 'For RechargeId: ' + response.data.RechargeID + ', and TransactionId: ' + response.data.Transid,
                                status: response.data.Status,
                                createdBy: userid,
                                modifiedBy: userid
                            };
                            let addWalttet = await addNewWallet(newWallet1)
                        }



                        const userData = await getUserById(userid)

                        let walletBalance = userData.walletBalance;
                        let newWalletBalance = parseFloat(walletBalance) - parseFloat(amount) + parseFloat(cashback)


                        await Users.findOneAndUpdate({ _id: new ObjectId(userid) }, {
                            walletBalance: newWalletBalance,
                        }, {
                            new: true
                        }).then((user) => {

                            console.log(newWalletBalance)
                            // res.status(200).send(user);
                            resolve(user)

                        }).catch((error) => {
                            reject(error)
                        })

                    } else {
                        let recharge = {
                            transactionId: response.data.Transid,
                            userid: userid,
                            mobile: phone,
                            amount: amount,
                            operator: optcode,
                            status: response.data.Status,
                            createdBy: userid,
                            modifiedBy: userid,
                        }
                        await addRechargeManager(recharge)
                        console.log(response)
                        reject(new InternalServerError(response.data.Errormsg))
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

module.exports = { rechargeTransactionManager, razorpayRechargeTransactionManager }
