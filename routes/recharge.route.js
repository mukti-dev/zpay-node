const express = require('express')
const { rechargeHistory, rechargeDetail, rechargePending, todayRecharge, allRecharge, oldRecharge } = require('../controllers/recharge.controller')
const { authentication } = require('../services/auth.service')
const router = express.Router()


router.post('/history/:userid', authentication, rechargeHistory)
router.get('/singlerecharge/:rechargeid', authentication, rechargeDetail)
router.get('/pendingrecharge', authentication, rechargePending)
router.get('/todayrecharge', authentication, todayRecharge)
// router.get('/allrecharge', authentication, allRecharge)
router.get('/allrecharge', authentication, oldRecharge)



module.exports = router