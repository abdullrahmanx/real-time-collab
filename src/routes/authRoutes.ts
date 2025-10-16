const express= require('express')
const router= express.Router()

import {register,
login,profile,
verifyEmail,
resendVerification,
forgotPassword,
changePassword,
resetPassword,
updateProfile, 
refreshToken,logout, logoutAllSessions, logoutSession} from '../controllers/authController'

import { verifyToken } from '../middlewares/authMiddleware'
import { loginSchema,
    registerSchema,
    updateProfileSchema,
    forgotPasswordSchema,
    resetPasswordSchema,resendVerificationSchema,validate, 
    changePasswordSchema,refreshTokenSchema} from '../middlewares/userValidation'


import upload  from '../middlewares/upload'


router.post('/register', validate(registerSchema),register)

router.get('/verify-email/:token',verifyEmail)

router.post('/resend-verification',validate(resendVerificationSchema),resendVerification)

router.post('/login',validate(loginSchema),login)

router.post('/logout',verifyToken,logout)

router.post('/logout-all',verifyToken,logoutAllSessions)

router.post('/logout-session',verifyToken,logoutSession)



router.post('/refresh-token',validate(refreshTokenSchema),refreshToken)

router.post('/forgot-password',validate(forgotPasswordSchema),forgotPassword)

router.post('/reset-password/:token', validate(resetPasswordSchema),resetPassword)

router.post('/change-password',verifyToken,validate(changePasswordSchema),changePassword)

router.get('/me',verifyToken,profile)

router.put('/me',verifyToken,upload.single('avatar'),validate(updateProfileSchema),updateProfile)


export default router