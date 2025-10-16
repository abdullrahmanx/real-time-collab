import Joi from "joi";
import { Request,Response,NextFunction } from "express";
export const createWorkspaceSchema= Joi.object({
    name: Joi.string().min(3).max(50).trim().required().messages({
        'string.empty': 'Workspace name cannot be empty',
        'string.min': 'Workspace name must be atleast 3 characters',
        'string.max': 'Workspace name cannot exceed 50 characters',
        'any.required': 'Workspace name is required'
    }),
    description: Joi.string().min(30).max(150).optional().messages({
        'string.empty': 'Description name cannot be empty',
        'string.min': 'Workspace description name must be atleast 20 characters',
        'string.max': 'Workspace description cannot exceed 150 characters',
    }),
    settings: Joi.string().optional().messages({
        'object.base': 'Settings must be an object'
    })
}) 

export const updateWorkspaceSchema= Joi.object({
    name: Joi.string().min(3).max(50).trim().optional().messages({
        'string.empty': 'Workspace name cannot be empty',
        'string.min': 'Workspace name must be atleast 3 characters',
        'string.max': 'Workspace name cannot exceed 50 characters',
    }),
    description: Joi.string().min(30).max(150).optional().messages({
        'string.empty': 'Description name cannot be empty',
        'string.min': 'Workspace description name must be atleast 20 characters',
        'string.max': 'Workspace description cannot exceed 150 characters',
    }),
    settings: Joi.optional().messages({
        'object.base': 'Settings must be an object'
    })
}).min(1).messages({
    'object.base': 'At least update on field'
})

export const inviteSchema= Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email',
        'string.empty': 'Email cannot be empty',
        'any.required': 'Email is required'
    }),
    role: Joi.string().optional().messages({
        'string.empty': 'Role cannot be empty'
    }),
    workspaceId: Joi.string().required().messages({
        'string.empty': 'Workspace id cannot be empty',
        'any.required': 'Workspace id is required'
    })
})

export const updatedMemberSchema= Joi.object({
    role: Joi.string().valid('admin','editor','viewer').required().messages({
        'string.empty': 'Role cannot be empty',
        'any.only': 'Role must be on of : admin, editor, viewer'
    })
})


export const validate= (schema: Joi.ObjectSchema) => {
    return (req:Request, res: Response, next: NextFunction ): void => {
        const {error} = schema.validate(req.body, {abortEarly: false,stripUnknown: true})
        if(error) {
            const errors= error.details.map(details => ({
                field: details.path.join('.'),
                message: details.message.replace(/"/g,'')
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


