import Joi from "joi";
import { Request, Response, NextFunction } from "express";

export const createDocumentSchema = Joi.object({
    title: Joi.string()
        .min(3)
        .max(50)
        .trim()
        .required()
        .messages({
            'string.empty': 'Document title cannot be empty',
            'string.min': 'Document title must be at least 3 character',
            'string.max': 'Document title cannot exceed 50 characters',
            'any.required': 'Document title is required'
        }),
    content: Joi.any()
        .optional()
        .messages({
            'any.required': 'Content is required'
        }),
    folderId: Joi.string()
        .optional()
        .messages({
            'string.base': 'Folder ID must be a string',
            'string.empty': 'Folder ID cannot be empty'
        })
});

export const updateDocumentSchema = Joi.object({
    title: Joi.string()
        .min(1)
        .max(100)
        .trim()
        .optional()
        .messages({
            'string.min': 'Document title must be at least 1 character',
            'string.max': 'Document title cannot exceed 100 characters'
        }),
    content: Joi.any()
        .optional()
        .messages({
            'any.required': 'Content is required'
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