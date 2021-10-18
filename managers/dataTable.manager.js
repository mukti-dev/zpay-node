const Operator = require('../models/operator.model')
const Users = require('../models/users.models')
const { Wallet } = require('../models/wallet.models')
const { Recharge } = require('../models/recharge.models')
const { ObjectId } = require('mongoose').Types
const moment = require('moment')

const getOperatorsByCode = async (optCodes) => {
    try {
        const operators = await Operator.find({ operatorCode: { $in: optCodes } })
        return (JSON.parse(JSON.stringify(operators)))
    } catch (error) {
        throw error
    }
}

const findOperatorRecords = async (searchValue, filter, reason) => {
    let query
    if (searchValue || searchValue !== null || searchValue.trim() !== "" || searchValue !== undefined) {
        let searchKey = new RegExp(searchValue, 'i')
        query = {
            $or: [
                { name: { $regex: searchKey } },
                { operatorCode: { $regex: searchKey } },
                { cashbackPercentageForZpay: { $regex: searchKey } },
                { cashbackPercentageForCustomer: { $regex: searchKey } }
            ]
        }
    } else {
        query = {}
    }

    let result

    if (reason == 'count') {
        result = await Operator.count(query)
    }
    if (reason == 'records') {
        let sorting = {}
        sorting[filter.document] = filter.sort
        result = await Operator.find(query).limit(filter.limit).skip(filter.skip).sort(sorting)
    }
    return result
}

const finduserList = async (searchValue, filter, reason) => {
    let matchQuery
    console.log(searchValue)
    if (searchValue && searchValue !== null && searchValue.trim() !== "" && searchValue !== undefined) {
        let searchKey = new RegExp(searchValue, 'i') || ""
        matchQuery = {
            $and: [
                {
                    $or: [
                        { name: { $regex: searchKey } },
                        { phone: { $regex: searchKey } },
                        { email: { $regex: searchKey } },
                        // { walletBalance: { $regex: searchKey } },
                        { status: { $regex: searchKey } }
                    ]
                },
                { userType: 'customer' }
            ]
        }
    } else {
        matchQuery = { userType: 'customer' }
    }

    let result

    if (reason == 'count') {
        result = await Users.count(matchQuery)
    }
    if (reason == 'records') {
        let sorting = {}
        let sort = 1
        if (filter.sort == "desc") {
            sort = -1
        }
        sorting[filter.document] = parseInt(sort)

        const aggrArr = [
            { $match: matchQuery },
            {
                $lookup: {
                    from: 'wallets',
                    let: {
                        id: "$_id"
                    },
                    "pipeline": [
                        {
                            "$match": {
                                "$and": [
                                    {
                                        "$expr": {
                                            "$eq": [
                                                "$$id",
                                                "$userid"
                                            ]
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            "$sort": {
                                "createdAt": -1
                            }
                        },
                        {
                            "$limit": 1
                        }
                    ],
                    "as": "walletData"
                }
            },
            { $sort: sorting },
            { $limit: parseInt(filter.limit) },
            { $skip: parseInt(filter.skip) },
        ]
        result = await Users.aggregate(aggrArr).exec()
        console.log(result[0].walletData)
    }
    return result
}

const walletUserRecords = async (searchValue, filter, reason) => {
    const userId = filter.data.userId
    let matchQuery
    if (searchValue && searchValue !== null && searchValue.trim() !== "" && searchValue !== undefined) {
        let searchKey = new RegExp(searchValue, 'i') || ""
        matchQuery = {
            $and: [
                {
                    $or: [
                        { naration: { $regex: searchKey } },
                        // { debit: { $regex: searchKey } },
                        // { credit: { $regex: searchKey } },
                        // { $where: `${searchKey}.test(this.debit)` },
                        // { $where: `${searchKey}.test(this.credit)` }
                    ]
                },
                { userid: ObjectId(userId) }
            ]
        }
    } else {
        matchQuery = { userid: ObjectId(userId) }
    }

    let result

    if (reason == 'count') {
        result = await Wallet.count(matchQuery)
    }
    if (reason == 'records') {
        let sorting = {}
        let sort = 1
        if (filter.sort == "desc") {
            sort = -1
        }
        sorting[filter.document] = parseInt(sort)

        const aggrArr = [
            { $match: matchQuery },
            {
                '$lookup': {
                    'from': 'recharges',
                    'localField': 'rechargeId',
                    'foreignField': '_id',
                    'as': 'rechargeDetails'
                }
            },
            {
                '$unwind': {
                    'path': '$rechargeDetails',
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                '$lookup': {
                    'from': 'users',
                    'localField': 'userid',
                    'foreignField': '_id',
                    'as': 'userDetail'
                }
            },
            {
                "$unwind": "$userDetail"
            },

            {
                "$addFields": {
                    name: "$userDetail.name",
                    phone: "$userDetail.phone",
                    date: "$userDetail.createdAt",
                }
            },

            { $sort: sorting },
            { $limit: parseInt(filter.limit) + parseInt(filter.skip) },
            { $skip: parseInt(filter.skip) },

            {
                $project: {
                    name: 1,
                    phone: 1,
                    date: 1,
                    operator: 1,
                    naration: 1,
                    debit: 1,
                    credit: 1,
                    restAmount: 1,
                    createdAt: 1
                }
            }
        ]
        result = await Wallet.aggregate(aggrArr).exec()
    }

    return result
}

const todayRechargeRecords = async (searchValue, filter, reason) => {
    let today = moment().format('DD-MM-YYYY') + " 12:00:00 AM"
    today = moment(today, 'DD-MM-YYYY hh:mm:ss A').format()

    let matchQuery
    if (searchValue && searchValue !== null && searchValue.trim() !== "" && searchValue !== undefined) {
        let searchKey = new RegExp(searchValue, 'i') || ""
        matchQuery = {
            $and: [
                {
                    $or: [
                        { mobile: { $regex: searchKey } },
                        { errormessage: { $regex: searchKey } },
                        { status: { $regex: searchKey } },
                    ]
                },
                {
                    createdAt: {
                        "$gte": new Date(today)
                    }
                }
            ]
        }
    } else {
        matchQuery = {
            createdAt: {
                "$gte": new Date(today)
            }
        }
    }
    if (reason == 'count') {
        result = await Recharge.count(matchQuery)
    }
    if (reason == 'records') {
        let sorting = {}
        let sort = 1
        if (filter.sort == "desc") {
            sort = -1
        }
        sorting[filter.document] = parseInt(sort)

        const aggrArr = [
            { $match: matchQuery },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userid',
                    foreignField: '_id',
                    as: 'userDetail'
                }
            },
            { $unwind: "$userDetail" },
            {
                $lookup: {
                    from: 'wallets',
                    let: { id: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $and: [
                                    { $expr: { $eq: ['recharge', "$source"] } },
                                    { $expr: { $eq: ['$$id', "$rechargeId"] } }
                                ]
                            }
                        }
                    ],
                    as: 'txnDetail'
                }
            },
            { $unwind: '$txnDetail' },
            {
                "$addFields": {
                    name: "$userDetail.name",
                    phone: "$userDetail.phone",
                    txnId: "$txnDetail._id",
                }
            },
            { $sort: sorting },
            { $limit: parseInt(filter.limit) + parseInt(filter.skip) },
            { $skip: parseInt(filter.skip) },
            {
                $project: {
                    name: 1,
                    phone: 1,
                    txnId: 1,
                    mobile: 1,
                    amount: 1,
                    operator: 1,
                    status: 1,
                    errormessage: 1,
                    transactionId: 1,
                    createdAt: 1
                }
            }
        ]
        result = await Recharge.aggregate(aggrArr).exec()
    }

    return result

}
const oldRechargeRecords = async (searchValue, filter, reason) => {
    let today = moment().format('DD-MM-YYYY') + " 12:00:00 AM"
    today = moment(today, 'DD-MM-YYYY hh:mm:ss A').format()

    let matchQuery
    if (searchValue && searchValue !== null && searchValue.trim() !== "" && searchValue !== undefined) {
        let searchKey = new RegExp(searchValue, 'i') || ""
        matchQuery = {
            $and: [
                {
                    $or: [
                        { mobile: { $regex: searchKey } },
                        { errormessage: { $regex: searchKey } },
                        { status: { $regex: searchKey } },
                    ]
                },
                {
                    createdAt: {
                        "$lt": new Date(today)
                    }
                }
            ]
        }
    } else {
        matchQuery = {
            createdAt: {
                "$lt": new Date(today)
            }
        }
    }
    if (reason == 'count') {
        result = await Recharge.count(matchQuery)
    }
    if (reason == 'records') {
        let sorting = {}
        let sort = 1
        if (filter.sort == "desc") {
            sort = -1
        }
        sorting[filter.document] = parseInt(sort)

        const aggrArr = [
            { $match: matchQuery },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userid',
                    foreignField: '_id',
                    as: 'userDetail'
                }
            },
            { $unwind: "$userDetail" },
            {
                $lookup: {
                    from: 'wallets',
                    let: { id: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $and: [
                                    { $expr: { $eq: ['recharge', "$source"] } },
                                    { $expr: { $eq: ['$$id', "$rechargeId"] } }
                                ]
                            }
                        }
                    ],
                    as: 'txnDetail'
                }
            },
            { $unwind: '$txnDetail' },
            {
                "$addFields": {
                    name: "$userDetail.name",
                    phone: "$userDetail.phone",
                    txnId: "$txnDetail._id",
                }
            },
            { $sort: sorting },
            { $limit: parseInt(filter.limit) + parseInt(filter.skip) },
            { $skip: parseInt(filter.skip) },
            {
                $project: {
                    name: 1,
                    phone: 1,
                    txnId: 1,
                    mobile: 1,
                    amount: 1,
                    operator: 1,
                    status: 1,
                    errormessage: 1,
                    createdAt: 1,
                    transactionId: 1
                }
            }
        ]
        result = await Recharge.aggregate(aggrArr).exec()
    }

    return result

}

const pendingRechargeRecords = async (searchValue, filter, reason) => {
    let today = moment().format('DD-MM-YYYY') + " 12:00:00 AM"
    today = moment(today, 'DD-MM-YYYY hh:mm:ss A').format()

    let matchQuery
    if (searchValue && searchValue !== null && searchValue.trim() !== "" && searchValue !== undefined) {
        let searchKey = new RegExp(searchValue, 'i') || ""
        matchQuery = {
            $and: [
                {
                    $or: [
                        { mobile: { $regex: searchKey } },
                        { errormessage: { $regex: searchKey } },
                        { status: { $regex: searchKey } },
                    ]
                },
                { status: 'Pending' }
            ]
        }
    } else {
        matchQuery = { status: 'Pending' }
    }
    if (reason == 'count') {
        result = await Recharge.count(matchQuery)
    }
    if (reason == 'records') {
        let sorting = {}
        let sort = 1
        if (filter.sort == "desc") {
            sort = -1
        }
        sorting[filter.document] = parseInt(sort)

        const aggrArr = [
            { $match: matchQuery },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userid',
                    foreignField: '_id',
                    as: 'userDetail'
                }
            },
            { $unwind: "$userDetail" },
            {
                $lookup: {
                    from: 'wallets',
                    let: { id: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $and: [
                                    { $expr: { $eq: ['recharge', "$source"] } },
                                    { $expr: { $eq: ['$$id', "$rechargeId"] } }
                                ]
                            }
                        }
                    ],
                    as: 'txnDetail'
                }
            },
            { $unwind: '$txnDetail' },
            {
                "$addFields": {
                    name: "$userDetail.name",
                    phone: "$userDetail.phone",
                    txnId: "$txnDetail._id",
                }
            },
            { $sort: sorting },
            { $limit: parseInt(filter.limit) + parseInt(filter.skip) },
            { $skip: parseInt(filter.skip) },
            {
                $project: {
                    name: 1,
                    phone: 1,
                    txnId: 1,
                    mobile: 1,
                    amount: 1,
                    operator: 1,
                    status: 1,
                    errormessage: 1,
                    transactionId: 1,
                    createdAt: 1
                }
            }
        ]
        result = await Recharge.aggregate(aggrArr).exec()
    }

    return result

}
const walletTransactionRecords = async (searchValue, filter, reason) => {
    let today = moment().format('DD-MM-YYYY') + " 12:00:00 AM"
    today = moment(today, 'DD-MM-YYYY hh:mm:ss A').format()

    let matchQuery
    if (searchValue && searchValue !== null && searchValue.trim() !== "" && searchValue !== undefined) {
        let searchKey = new RegExp(searchValue, 'i') || ""
        matchQuery = {

            $and: [
                {
                    $or: [
                        { mobile: { $regex: searchKey } },
                        { errormessage: { $regex: searchKey } },
                        { status: { $regex: searchKey } },
                    ]
                },
                {
                    createdAt: {
                        "$gte": new Date(today)
                    }
                }
            ]

        }
    } else {
        matchQuery = {
            createdAt: {
                "$gte": new Date(today)
            }
        }
    }
    if (reason == 'count') {
        result = await Wallet.count(matchQuery)
    }
    if (reason == 'records') {
        let sorting = {}
        let sort = 1
        if (filter.sort == "desc") {
            sort = -1
        }
        sorting[filter.document] = parseInt(sort)

        const aggrArr = [
            { $match: matchQuery },
            { $sort: { createdAt: 1 } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userid',
                    foreignField: '_id',
                    as: 'userDetail'
                }
            },
            { $unwind: "$userDetail" },
            {
                $lookup: {
                    from: 'recharges',
                    localField: 'rechargeId',
                    foreignField: '_id',
                    as: 'rechargeDetails'
                }
            },
            {
                $unwind: {
                    'path': '$rechargeDetails',
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$addFields": {
                    name: "$userDetail.name",
                    phone: "$userDetail.phone",
                }
            },
            { $sort: sorting },
            { $limit: parseInt(filter.limit) + parseInt(filter.skip) },
            { $skip: parseInt(filter.skip) },
            {
                $project: {
                    name: 1,
                    phone: 1,
                    naration: 1,
                    credit: 1,
                    debit: 1,
                    operator: 1,
                    restAmount: 1,
                    createdAt: 1,
                    transactionId: 1
                }
            }
        ]
        result = await Wallet.aggregate(aggrArr).exec()
    }

    return result

}

const walletBalanceRecords = async (searchValue, filter, reason) => {
    let today = moment().format('DD-MM-YYYY') + " 12:00:00 AM"
    today = moment(today, 'DD-MM-YYYY hh:mm:ss A').format()

    let matchQuery
    if (searchValue && searchValue !== null && searchValue.trim() !== "" && searchValue !== undefined) {
        let searchKey = new RegExp(searchValue, 'i') || ""
        matchQuery = {
            $and: [
                {
                    $or: [
                        { mobile: { $regex: searchKey } },
                        { errormessage: { $regex: searchKey } },
                        { status: { $regex: searchKey } },
                    ]
                }, {
                    createdAt: {
                        "$lt": new Date(today)
                    }
                }
            ]

        }
    } else {
        matchQuery = {
            createdAt: {
                "$lt": new Date(today)
            }
        }
    }
    if (reason == 'count') {
        result = await Wallet.count(matchQuery)
    }
    if (reason == 'records') {
        let sorting = {}
        let sort = 1
        if (filter.sort == "desc") {
            sort = -1
        }
        sorting[filter.document] = parseInt(sort)

        const aggrArr = [
            { $match: matchQuery },
            { $sort: { createdAt: 1 } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userid',
                    foreignField: '_id',
                    as: 'userDetail'
                }
            },
            { $unwind: "$userDetail" },
            {
                $lookup: {
                    from: 'recharges',
                    localField: 'rechargeId',
                    foreignField: '_id',
                    as: 'rechargeDetails'
                }
            },
            {
                $unwind: {
                    'path': '$rechargeDetails',
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$addFields": {
                    name: "$userDetail.name",
                    phone: "$userDetail.phone",
                }
            },
            { $sort: sorting },
            { $limit: parseInt(filter.limit) + parseInt(filter.skip) },
            { $skip: parseInt(filter.skip) },
            {
                $project: {
                    name: 1,
                    phone: 1,
                    naration: 1,
                    credit: 1,
                    debit: 1,
                    operator: 1,
                    restAmount: 1,
                    createdAt: 1,
                    transactionId: 1
                }
            }
        ]
        result = await Wallet.aggregate(aggrArr).exec()
    }

    return result

}


module.exports = { findOperatorRecords, finduserList, walletUserRecords, todayRechargeRecords, oldRechargeRecords, pendingRechargeRecords, walletTransactionRecords, getOperatorsByCode, walletBalanceRecords }
