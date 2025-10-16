import Joi from "joi";
import { Request, Response,NextFunction } from "express";



export const registerSchema= Joi.object({
    name: Joi.string().min(3).max(50).trim().required().messages({
        'string.empty': 'Name cannot be empty',
        'string.min': 'Name must be atleast 3 characters',
        'string.max': 'Name must be cannot exceed 20 characters',
        'any.required': 'Name is required'
    }),
    email: Joi.string().email().required().messages({
        'string.empty': 'Email cannot be empty',
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
        'string.empty': 'Password cannot be empty',
        'string.min': 'Password must be at least 6 characters',
        'any.required': 'Password is required'
    })
})

export const loginSchema= Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email',
        'string.empty': 'Email cannot be empty',
        'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
        'string.empty': 'Password cannot be empty',
        'any.required': 'Password is required'
    }) 
})

export const forgotPasswordSchema= Joi.object({
    email: Joi.string().email().required().messages({
        'string.empty': 'Email cannot be empty',
        'string.email': 'Please provide a valid email',
        'any.required': 'Email is required'
    })
})

export const resetPasswordSchema= Joi.object({
    newPassword: Joi.string().min(6).max(100).required().messages({
        'string.empty': 'New password cannot be empty',
        'string.min': 'Password must be atleast 6 characters',
        'string.max': 'Password cannot exceed 100 characters',
        'any.required': 'New passowrd is required'
    })
})

export const changePasswordSchema= Joi.object({
    currentPassword: Joi.string().required().messages({
        'string.empty': 'Current password cannot be empty',
        'any.required': 'Current password is required'
    }),
    newPassword: Joi.string().min(6).max(100).required().messages({
        'string.empty': 'New password cannot be empty',
        'string.min': 'Password must be atleast 6 characters',
        'string.max': 'Password cannot exceed 100 characters',
        'any.required': 'New passowrd is required'
    })
})

export const updateProfileSchema= Joi.object({
    name: Joi.string().min(3).max(50).trim().optional(),
    email: Joi.string().lowercase().trim().optional()
}).min(1).messages({
    'object.min': 'At least update on field'
})

export const resendVerificationSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please provide a valid email',
            'any.required': 'Email is required'
        })
});

export const refreshTokenSchema= Joi.object({
    refreshToken: Joi.string().required().messages({
        'string.base': 'Refresh token must be a string',
        'any.required': 'Refresh token is required'
    })
})




export const validate = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const {error} = schema.validate(req.body,{abortEarly: false,stripUnknown: true})
        if(error) {
            const errors= error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message.replace(/"/g, '')
            }))
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            })
          return  
        }
        next()
    }
}

