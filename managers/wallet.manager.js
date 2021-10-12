const { Wallet } = require('../models/wallet.models')
const { ObjectId } = require('mongoose').Types
const Transaction = require('../models/transaction.models')
const Users = require('../models/users.models')
const { Recharge } = require('../models/recharge.models')
const axios = require('axios')
const { UpgradeRequiredError, InternalServerError } = require('../_errorHandler/error')
const operatorConfig = require('../config/operatorConfig.json')
const { getUserById } = require('../managers/user.manager')
const { addRechargeManager } = require('../managers/recharge.manager')
const { narationText } = require('../services/narationText')

const uuidv4 = require('uuid').v4

const moment = require('moment')


const getWalletData = async (userId, reqBody) => {
    try {
        let matchQuery
        if (reqBody.startDate && reqBody.endDate) {
            matchQuery = {
                $and: [{ userid: userId }, {
                    "createdAt": {
                        "$gte": reqBody.startDate,
                        "$lt": reqBody.endDate
                    }
                }]
            }
        } else {
            matchQuery = { userid: new ObjectId(userId) }
        }
        const walletData = await Wallet.aggregate([
            { $match: matchQuery },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userid',
                    foreignField: '_id',
                    as: 'userData'
                }
            }

        ]).exec()
        // const walletData = await Wallet.find(matchQuery).exec()
        console.log(walletData)
        return walletData

    } catch (error) {
        throw error
    }

}
const getWalletDetail = async (rechargeId) => {
    try {
        return await Wallet.find({ _id: new ObjectId(rechargeId) }).exec()


    } catch (error) {
        throw error
    }
}


const getAllWallet = async (userId) => {
    userId = userId || false
    try {
        // return await Wallet.find({}).exec()
        let aggrArr = [
            { $sort: { createdAt: 1 } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userid',
                    foreignField: '_id',
                    as: 'userDetail'
                }
            },
            {
                $lookup: {
                    from: 'recharges',
                    localField: 'rechargeId',
                    foreignField: '_id',
                    as: 'rechargeDetails'
                }
            },

        ]
        if (userId) {
            aggrArr.push({
                $match: {
                    userid: ObjectId(userId),
                }
            })
        }
        const result = await Wallet.aggregate(aggrArr).exec()

        const data = JSON.parse(JSON.stringify(result))

        let response = []
        let total = 0
        for (let i = 0; i < data.length; i++) {


            let service = "N/A"
            let operator = "N/A"
            let phone = ""
            let name = ""
            if (data[i].service) {
                service = data[i].service
            }
            if (data[i].operator) {
                operator = data[i].operator
            }
            if (data[i].userDetail.length > 0) {
                phone = data[i].userDetail[0].phone
                name = data[i].userDetail[0].name
            }

            if (data[i].rechargeDetails.length > 0) {
                let optCode = data[i].rechargeDetails[0].operator
                let operatorData = operatorConfig.find(e => e.operatorCode === optCode);
                service = operatorData.operatorType
                operator = operatorData.operatorName
            }

            let credit = data[i].credit ? data[i].credit : 0
            let debit = data[i].debit ? data[i].debit : 0
            total = total + parseFloat(credit) - parseFloat(debit)

            let obj = {
                mobile: phone,
                name: name,
                services: service,
                operator: operator,
                naration: data[i].naration,
                credit: credit,
                debit: debit,
                total: total
            }
            if (data[i].userDetail.length > 0) {
                response.push(obj)
            }

        }
        return response
    } catch (error) {
        throw error
    }
}


const getTodayWallet = async () => {
    try {

        let today = moment().format('DD-MM-YYYY') + " 12:00:00 AM"
        today = moment(today, 'DD-MM-YYYY hh:mm:ss A').format()

        let aggrArr = [
            { $sort: { createdAt: 1 } },
            {
                $match: {
                    createdAt: {
                        "$gte": new Date(today)
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userid',
                    foreignField: '_id',
                    as: 'userDetail'
                }
            },
            {
                $lookup: {
                    from: 'recharges',
                    localField: 'rechargeId',
                    foreignField: '_id',
                    as: 'rechargeDetails'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'createduserDetail'
                }
            }

        ]
        const result = await Wallet.aggregate(aggrArr).exec()
        const data = JSON.parse(JSON.stringify(result))

        let response = []
        let total = 0
        for (let i = 0; i < data.length; i++) {

            let phone = ""
            let name = ""
            if (data[i].service) {
                service = data[i].service
            }
            if (data[i].operator) {
                operator = data[i].operator
            }
            if (data[i].userDetail.length > 0) {
                phone = data[i].userDetail[0].phone
                name = data[i].userDetail[0].name
            }

            let credit = data[i].credit ? data[i].credit : 0
            let debit = data[i].debit ? data[i].debit : 0
            total = total + parseFloat(credit) - parseFloat(debit)

            let obj = {
                mobile: phone,
                name: name,
                naration: data[i].naration,
                createdBy: data[i]?.createduserDetail[0]?.name,
                createdAt: data[i].createdAt,
                credit: credit,
                debit: debit,
                total: total
            }
            if (data[i].userDetail.length > 0) {
                response.push(obj)
            }

        }
        return response
    } catch (error) {
        throw error
    }
}
const addNewTransaction = async (reqBody) => {
    try {
        const transaction = new Transaction(reqBody)
        return transaction.save()
    } catch (error) {
        throw error
    }
}

const addNewWallet = async (reqBody) => {
    try {
        const wallet = new Wallet(reqBody)
        const userData = await getUserById(reqBody.userid)
        let walletBalance = userData.walletBalance;
        let newWalletBalance = parseFloat(walletBalance) - parseFloat(reqBody.debit) + parseFloat(reqBody.credit)
        await Users.findOneAndUpdate({ _id: new ObjectId(userid) }, { walletBalance: newWalletBalance }, { new: true }).exec()
        return wallet.save()
    } catch (error) {
        throw error
    }

}

const updateWalletBalance = async (userid, amount) => {
    try {
        let user = await Users.findOne({ _id: new ObjectId(userid) }).exec()
        let walletBalance = user.walletBalance;
        let newWalletBalance = parseFloat(walletBalance) + parseFloat(amount)
        await Users.updateOne({ _id: new ObjectId(userid) }, { walletBalance: newWalletBalance }, { new: true }).exec()
        user = JSON.parse(JSON.stringify(user))
        delete user.password
        delete user.__v
        delete user.walletBalance
        user.walletBalance = newWalletBalance
        return user
    } catch (error) {
        throw error
    }

}

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

        let bal = 0
        if (wallet.length > 0) {
            bal = wallet[0].creditsum - wallet[0].debitsum;
        }
        console.log(bal)
        const zpayRchId = uuidv4()
        if (bal >= amount) {
            return new Promise(async (resolve, reject) => {
                let post_data = JSON.stringify({
                    "Customernumber": phone,
                    "Tokenid": tokenid,
                    "Userid": userid1,
                    "Amount": amount,
                    "Optcode": optcode,
                    "Yourrchid": zpayRchId,
                });
                console.log(post_data)

                let config = {
                    method: 'post',
                    url: 'https://www.zpay.co.in/Recharge/Recharge',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: post_data
                };

                axios(config).then(async (response) => {
                    // console.log(response)
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
                            const narationObj = { phone, Transid: response.data.Transid }
                            let newWallet1 = {
                                userid: userid,
                                debit: amount,
                                operator: optcode,
                                rechargeId: addRecharge._id,
                                transactionSource: devSource,
                                naration: narationText(narationObj, 'RT_wallet_debit'),
                                status: response.data.Status,
                                createdBy: userid,
                                modifiedBy: userid
                            };
                            let addWalttet = await addNewWallet(newWallet1)
                        }
                        if (parseFloat(cashback) > 0) {
                            const narationObj = { phone, RechargeID: response.data.RechargeID, Transid: response.data.Transid }
                            let newWallet1 = {
                                userid: userid,
                                credit: cashback,
                                operator: optcode,
                                rechargeId: addRecharge._id,
                                transactionSource: devSource,
                                naration: narationText(narationObj, 'RT_cashback'),
                                status: response.data.Status,
                                createdBy: userid,
                                modifiedBy: userid
                            };
                            let addWalttet = await addNewWallet(newWallet1)
                        }

                        const userData = await getUserById(userid)

                        let walletBalance = userData.walletBalance;
                        let newWalletBalance = parseFloat(walletBalance) - parseFloat(amount) + parseFloat(cashback)

                        await Users.findOneAndUpdate({ _id: new ObjectId(userid) }, { walletBalance: newWalletBalance }, {
                            new: true
                        }).then((user) => {
                            console.log(newWalletBalance)
                            // res.status(200).send(user);
                            resolve(user)

                        });

                    } else if (response.data.Status == 'Pending') {

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
                            const narationObj = { RechargeID: response.data.RechargeID, Transid: response.data.Transid }
                            let newWallet1 = {
                                userid: userid,
                                debit: amount,
                                operator: optcode,
                                rechargeId: addRecharge._id,
                                transactionSource: devSource,
                                naration: narationText(narationObj, 'RT_pending_wallet_debit'),
                                status: response.data.Status,
                                createdBy: userid,
                                modifiedBy: userid
                            };
                            let addWalttet = await addNewWallet(newWallet1)
                        }
                        let walletBalance = userData.walletBalance;
                        let newWalletBalance = parseFloat(walletBalance) - parseFloat(amount)
                        await Users.findOneAndUpdate({ _id: new ObjectId(userid) }, { walletBalance: newWalletBalance }, {
                            new: true
                        }).then((user) => {
                            console.log(newWalletBalance)
                            // res.status(200).send(user);
                            resolve(user)

                        });
                    } else if (response.data.Status == 'Failed') {
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

                        const narationObj = { phone }

                        let newWallet1 = {
                            userid: userid,
                            credit: amount,
                            rechargeId: addRecharge._id,
                            operator: optcode,
                            transactionSource: devSource,
                            naration: narationText(narationObj, 'RT_failed_wallet_refund'),
                            status: response.data.Status,
                            createdBy: userid,
                            modifiedBy: userid
                        };
                        let addWalttet = await addNewWallet(newWallet1)

                        reject(new InternalServerError(response.data.Errormsg))
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

        let narationObj = { amount, optcode }
        let addWalletbeforeRecarge = new Wallet({
            userid: userid,
            credit: amount,
            status: 'Success',
            transactionid: addTransactionBeforeRecharge._id,
            transactionSource: devSource,
            naration: narationText(narationObj, 'RRT_wallet_credit'),
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
                    "Yourrchid": uuidv4(),
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
                            const narationObj = { phone, Transid: response.data.Transid }
                            let newWallet1 = {
                                userid: userid,
                                debit: amount,
                                rechargeId: addRecharge._id,
                                operator: optcode,
                                transactionSource: devSource,
                                naration: narationText(narationObj, 'RRT_wallet_debit'),
                                status: response.data.Status,
                                createdBy: userid,
                                modifiedBy: userid
                            };
                            let addWalttet = await addNewWallet(newWallet1)
                        }
                        if (parseFloat(cashback) > 0) {
                            const narationObj = { phone, RechargeID: response.data.RechargeID, Transid: response.data.Transid }

                            let newWallet1 = {
                                userid: userid,
                                credit: cashback,
                                operator: optcode,
                                rechargeId: addRecharge._id,
                                transactionSource: devSource,
                                naration: narationText(narationObj, 'RRT_cashback'),
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

                    } else if (response.data.Status == 'Pending') {
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
                            const narationObj = { RechargeID: response.data.RechargeID, Transid: response.data.Transid }
                            let newWallet1 = {
                                userid: userid,
                                debit: amount,
                                rechargeId: addRecharge._id,
                                operator: optcode,
                                transactionSource: devSource,
                                naration: narationText(narationObj, 'RRT_pending_wallet_debit'),
                                status: response.data.Status,
                                createdBy: userid,
                                modifiedBy: userid
                            };
                            let addWalttet = await addNewWallet(newWallet1)
                        }
                        const userData = await getUserById(userid)
                        let walletBalance = userData.walletBalance;
                        let newWalletBalance = parseFloat(walletBalance) - parseFloat(amount)
                        await Users.findOneAndUpdate({ _id: new ObjectId(userid) }).exec()
                        reject(new InternalServerError(response.data.Errormsg))
                    } else if (response.data.Status == 'Failed') {
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
                        let newWallet1 = {
                            userid: userid,
                            credit: amount,
                            rechargeId: addRecharge._id,
                            operator: optcode,
                            transactionSource: devSource,
                            naration: 'Refund for recharge of ' + phone,
                            status: response.data.Status,
                            createdBy: userid,
                            modifiedBy: userid
                        };
                        let addWalttet = await addNewWallet(newWallet1)
                        reject(new InternalServerError(response.data.Errormsg))
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



module.exports = { getWalletData, getWalletDetail, getWalletDetail, getAllWallet, getTodayWallet, addNewTransaction, addNewWallet, updateWalletBalance, razorpayRechargeTransactionManager, rechargeTransactionManager }