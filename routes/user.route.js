const express = require('express')
const { registerUser, loginUser, changePassword, allUsers, checkUser, toggleStatus, getUser, authenticateAdmin } = require('../controllers/user.controller')
const { authentication } = require('../services/auth.service')

const otpRoute = require('./otp.route')
const router = express.Router()

router.use('/otp', otpRoute)

router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/login/admin', loginUser)
router.post('/changePassword', changePassword)
router.get('/alluser', authentication, allUsers)
router.get('/profile/:userId', authentication, getUser)
router.get('/phone/:phone', checkUser)
router.get('/toggleStatus/:userid', toggleStatus)
router.post('/validateUser', authenticateAdmin)

module.exports = router