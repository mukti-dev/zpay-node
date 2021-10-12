const { getRechargeData, getRechargeDetail, getRechargePendingData, gettodayRechargeData, getallRechargeData, getOldRechargeData } = require('../managers/recharge.manager')
const { successResponse, failureResponse } = require('../services/responseGenerator')
const rechargeHistory = async (req, res) => {
    try {
        console.log(req.params)
        const userId = req.params.userid
        const dateRange = req.body
        const rechargeData = await getRechargeData(userId, dateRange)
        successResponse(req, res, rechargeData, 'Recharge data fetched successfully')
    } catch (error) {
        failureResponse(req, res, error)
    }

}

const rechargeDetail = async (req, res) => {
    try {
        const rechargeData = await getRechargeDetail(req.params.rechargeid)
        successResponse(req, res, rechargeData, 'Recharge data fetched successfully')
    } catch (error) {
        failureResponse(req, res, error)
    }
}

const rechargePending = async (req, res) => {
    try {
        console.log(req.params)
        const status = 'pending'
        const dateRange = req.body
        const rechargeData = await getRechargePendingData(status, dateRange)
        successResponse(req, res, rechargeData, 'Pending Recharge data fetched successfully')
    } catch (error) {
        failureResponse(req, res, error)
    }

}

const todayRecharge = async (req, res) => {
    try {
        console.log(req.params)
        const createdAt = Date.now()
        const dateRange = req.body
        const rechargeData = await gettodayRechargeData(createdAt, dateRange)
        successResponse(req, res, rechargeData, 'Today Recharge data fetched successfully')
    } catch (error) {
        failureResponse(req, res, error)
    }

}


const allRecharge = async (req, res) => {
    try {
        // console.log(req.params)
        // const dateRange = req.body
        const rechargeData = await getallRechargeData()
        successResponse(req, res, rechargeData, 'All Recharge data fetched successfully')
    } catch (error) {
        failureResponse(req, res, error)
    }

}

const oldRecharge = async (req, res) => {
    try {
        const result = await getOldRechargeData()
        successResponse(req, res, result, 'All Old Recharges data fetched successfully')
    } catch (error) {
        failureResponse(req, res, error)
    }
}

module.exports = { rechargeHistory, rechargeDetail, rechargePending, todayRecharge, allRecharge, oldRecharge }