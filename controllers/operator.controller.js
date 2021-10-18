const { failureResponse, successResponse } = require("../services/responseGenerator")
const operatorConfig = require('../config/operatorConfig.json')
const { addOperatorManager, updateOperatorManager, getOperatorManager, getAllOperatorManager, getOperatorCashback, updateOperatorManagerNew } = require('../managers/operator.manager')
const addOperator = async (req, res) => {
    try {
        const add = await addOperatorManager(req.body)
        successResponse(req, res, add, 'Operator added')
    } catch (error) {
        failureResponse(req, res, error)
    }
}

const editOperator = async (req, res) => {
    try {
        const opId = req.params.operatorId
        const result = await updateOperatorManager(opId, req.body)
        successResponse(req, res, result, 'Operator updated')
    } catch (error) {
        failureResponse(req, res, error)
    }
}

const getOperator = async (req, res) => {
    try {
        const opId = req.params.operatorId
        const operator = await getOperatorManager(opId)
        successResponse(req, res, operator, 'Operator found')
    } catch (error) {
        failureResponse(req, res, error)
    }
}

const getAllOperator = async (req, res) => {
    try {
        const operators = await getAllOperatorManager()
        successResponse(req, res, operators, 'Operators fetched')
    } catch (error) {
        failureResponse(req, res, error)
    }
}

const getCashBack = async (req, res) => {
    try {
        const cashbacks = await getOperatorCashback(req.params.operatorCode)
        successResponse(req, res, cashbacks, 'Operators fetched')
    } catch (error) {
        failureResponse(req, res, error)
    }
}

const updateOperator = async (req, res) => {
    try {
        let opData
        let operatorData = operatorConfig.find(({ operatorCode }) => operatorCode === req.body.operatorCode);
        let operatorObj = {
            operatorName: operatorData.operatorName,
            operatorType: operatorData.operatorType,
            operatorCode: req.body.operatorCode,
            cashbackPercentageForZpay: req.body.cashbackPercentageForZpay,
            cashbackPercentageForCustomer: req.body.cashbackPercentageForCustomer,
            status: 'Active'
        }
        if ((!req.body.cashbackPercentageForZpay || (req.body.cashbackPercentageForZpay).trim() == "") && (!req.body.cashbackPercentageForCustomer || (req.body.cashbackPercentageForCustomer).trim() == "")) {
            operatorObj.status = 'InActive'
        }
        opData = await updateOperatorManagerNew(operatorObj)
        successResponse(req, res, opData, 'Operator updated')
    } catch (error) {
        failureResponse(req, res, error)
    }
}

module.exports = { addOperator, editOperator, getOperator, getAllOperator, getCashBack, updateOperator }