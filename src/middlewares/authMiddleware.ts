import jwt from 'jsonwebtoken'
import {Response, NextFunction} from 'express'
import {AuthRequest} from '../types'


export  const verifyToken = (req: AuthRequest,res: Response,next: NextFunction): void => {
        try {
            const authHeader= req.headers['authorization']
            if(!authHeader){
                res.status(401).json({
                    success: false,
                    message: 'Authorization header is required'
                })
                return 
            }
            const token= authHeader.split(' ')[1]
            if(!token) {
                res.status(401).json({
                    success: false,
                    message: 'Token is required'
                })
                return 
            }
            const decoded= jwt.verify(token,process.env.JWT_ACCESS as string) as {id: string, email: string}
            req.user= decoded
            next()
        } catch(err: any) {
            console.log('Error: ', err.message)
            if(err.name=== 'TokenExpiredError') {
                res.status(401).json({
                    success: false,
                    message: 'Access token has expired, Please refresh your token'
                })
                return
            }
            if(err.name=== 'JsonWebTokenError') {
                res.status(401).json({
                    success: false,
                    message: 'Invalid access token. Please log in again.'
                })
                return                
            }

            res.status(401).json({
                success: false,
                message: 'Authorization step failed'
            })
        }

}