const express = require('express')
const { operatorList, userList, userWalletList, todayRechargeList, oldRechargeList, pendingRechargeList, walletTransactionList, getoperatorList, walletBalanceList } = require('../controllers/dataTable.controller')
const router = express.Router()

router.get('/operatorList', getoperatorList)
router.post('/operatorList', operatorList)
router.post('/userList', userList)
router.post('/userwallet/:userId', userWalletList)
router.post('/todayrecharge', todayRechargeList)
router.post('/oldrecharge', oldRechargeList)
router.post('/pendingrecharge', pendingRechargeList)
router.post('/walletTransaction', walletTransactionList)
router.post('/walletBalance', walletBalanceList)


module.exports = router

