import Joi from "joi";
import { Request, Response, NextFunction } from "express";

export const createFolderSchema = Joi.object({
    name: Joi.string()
        .min(3)
        .max(50)
        .trim()
        .required()
        .messages({
            'string.empty': 'Folder name cannot be empty',
            'string.min': 'Folder name must be at least 3 character',
            'string.max': 'Folder name cannot exceed 50 characters',
            'any.required': 'Folder name is required'
        })
});

export const updateFolderSchema = Joi.object({
    name: Joi.string()
        .min(3)
        .max(50)
        .trim()
        .required()
        .messages({
            'string.empty': 'Folder name cannot be empty',
            'string.min': 'Folder name must be at least 3 character',
            'string.max': 'Folder name cannot exceed 50 characters',
            'any.required': 'Folder name is required'
        })
});

export const validate = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message.replace(/"/g, '')
            }));
            
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
            return;
        }
        next();
    };
};