const express = require('express')
const { registerUser, loginUser, changePassword, verifyOtp } = require('../controllers/otp.controller')
const { authentication } = require('../services/auth.service')
const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/changePassword', changePassword)

router.post('/verifyOtp', verifyOtp)

module.exports = router