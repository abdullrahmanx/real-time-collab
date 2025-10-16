import { Request,Response, NextFunction } from "express"

export const errorHandler = (err: any,req:Request,res: Response,next: NextFunction): void => {
    if(err.name === 'ValidationError') {
        const errors= Object.fromEntries(Object.values(err.errors).map((err: any) => [err.path,err.message]))
        res.status(400).json({
            success: false,
            message: errors.message
        })
        return
    }
    if(err.name ==='CastError') {
        res.status(400).json({
            success: false,
            message: `Invalid id: ${JSON.stringify(err.value)}`
        })
        return 
    }
    if(err.code === 11000 ) {
        const field= err.keyValue ? Object.keys(err.keyValue) : [];
        const msg= field.length ? `${field[0]} already exists`: 'Duplicate key error'
        res.status(400).json({
            success: false,
            message: msg,
            details: err.keyValue || 'Unkown field'
        })
        return 
    }
    res.status(err.statusCode || 500).json({
        status: err.status,
        message: err.message || 'Internal Server Error'
    })
    return 
}
