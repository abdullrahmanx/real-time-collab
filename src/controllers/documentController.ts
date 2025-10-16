import Document from '../models/documentSchema';
import Workspace from '../models/workspaceSchema';
import DocumentVersion from '../models/documentVersion';
import { AuthRequest } from '../types';
import { NextFunction, Request, Response } from 'express';




export const createDocument= async (req: AuthRequest,res: Response,next: NextFunction): Promise<void> => {
    try {
        const {title}= req.body;
        const workspaceId= req.params.workspaceId;
        const userId= req.user!.id;
        if(!title) {
            res.status(400).json({success: false, message: 'Title is required'})
            return
        }

        const workspace= await Workspace.findOne({'members.user': userId, _id: workspaceId})
        if(!workspace) {
            res.status(404).json({success: false,message: 'Workspace not found'})
            return 
        }
        const checkUserPerm= workspace.hasPermission(userId,2)
        if(!checkUserPerm) {
             res.status(403).json({
                success: false,
                message: 'You dont have permission to create a document'})
             return    
        }
        const newDocument= await Document.create({
            title,
            workspace: workspaceId,
            createdBy: userId,
            permissions: {
                canEdit: [userId],
                canComment: [userId],
                canView: [userId]
            }
        })
        await newDocument.populate('createdBy', 'name email avatar')
        await newDocument.populate('workspace','name')
        const newVersion= await DocumentVersion.create({
            document: newDocument,
            title: newDocument.title,
            content: newDocument.content,
            version: newDocument.version,
            createdBy: userId
        })
        await newVersion.populate('createdBy','name email avatar')

        res.status(201).json({
            success: true,
            message: 'Document created successfully',
            data: {
                document: newDocument
            }
        })
    }catch(err) {
        next(err)
    }
}
export const getDocuments= async (req: AuthRequest,res: Response,next: NextFunction): Promise<void> => {
    try {
        const userId= req.user!.id
        const workspaceId= req.params.workspaceId
        const {
            page=1,
            limit=20,
            search= '',
            status= 'draft',
            sortBy= 'createdAt',
            sortOrder= 'desc'
        } = req.query 
        const workspace= await Workspace.findOne({
            'members.user': userId,
            _id: workspaceId
        })
        if(!workspace) {
            res.status(404).json({success: false, message: 'Workspace not found'})
            return 
        }
        const query: any = {workspace: workspaceId}
        if(status && status!=='all'){
            query.status=status
        }
        if(search) {
            query.title= {$regex: search, $options: 'i'}
        }
        const sort: {[key: string]: 1 | -1}= {}
        sort[sortBy as string]= sortOrder === 'asc'? 1 : -1

        const pageNum= Number(page)
        const limitNum= Number(limit)
        const skip= (pageNum - 1) * limitNum
        
        const documents= await Document.find(query).select('-content').populate('createdBy', 'name email avatar')
            .populate('workspace','name')
            .sort(sort)
            .limit(limitNum)
            .skip(skip)

        const total= await Document.countDocuments(query)
        const totalPages= Math.ceil(total/limitNum)

        res.status(200).json({
            success: true,
            data: {
                documents: documents,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages,
                    prevPage: pageNum > 1 ? pageNum-1 : null,
                    nextPage: pageNum < totalPages ? pageNum + 1 :null
                }
            }
        })
    } catch(err) {
        next(err)
    }
}
export const getDocument= async (req:AuthRequest,res:Response,next:NextFunction): Promise<void> => {
    try {
        const userId= req.user!.id 

        const workspaceId= req.params.workspaceId

        const documentId= req.params.id

        const workspace= await Workspace.findOne({'members.user': userId ,_id: workspaceId})
         const docExists = await Document.findById(documentId)
        if(!workspace) {
            res.status(404).json({success: false, message: 'Workspace not found'})
            return 
        }
        const document= await Document.findOne({
            _id: documentId,
            workspace: workspaceId  
        }).populate('workspace', 'name')
          .populate('createdBy','name email avatar')
          .populate('lastEditedBy','name email avatar')
          .populate('permissions.canEdit','name email avatar')
          .populate('permissions.canComment','name email avatar')
          .populate('permissions.canView','name email avatar')

        if(!document) {
            res.status(404).json({success: false, message: 'Document not found'})
            return 
        }
        res.status(200).json({
            success: true,
            data: {
            document: document
            }
        })
    }catch(err) {
        next(err)
    }
}

export const updateDocument= async (req: AuthRequest,res: Response,next: NextFunction): Promise<void> => {
    try {
        const userId= req.user!.id
        const workspaceId= req.params.workspaceId
        const documentId= req.params.id 
        const {status,title,content}= req.body

        const workspace= await Workspace.findOne({'members.user': userId, _id: workspaceId})

        if(!workspace) {
            res.status(404).json({success: false, message: 'Workspace not found'})
            return 
        }
        const document= await Document.findOne({workspace: workspaceId, _id: documentId})
       
        if(!document) {
            res.status(404).json({success: false, message: 'Document not found'})
            return 
        }
        const userPerm= workspace.hasPermission(userId,2)
        const isCreator= document.createdBy.toString() === userId.toString()
        const canEdit= document.permissions.canEdit.includes(userId)

        if(!userPerm && !isCreator && !canEdit) {  
            res.status(403).json({success: false, message: 'You cant edit this document'})
            return  
        }

        if(title) document.title= title
        if(content) document.content=content
        if(status) document.status=status

        document.lastEditedBy= userId as any
        document.version += 1 as any
        await document.save()

        await document.populate('createdBy', 'name email avatar')
        await document.populate('lastEditedBy', 'name email avatar')
        await document.populate('workspace', 'name')

        const newVersion= await DocumentVersion.create({
            document: documentId,
            title: document.title,
            content: document.content,
            version: document.version,
            createdBy: userId
        })
        await newVersion.populate('createdBy','name email avatar')
 

        res.status(200).json({
            success: true,
            message: 'Document updated successfully',
            data: {
                document,
                newVersion
            }
        })
    }catch(err) {
        next(err)
    }   
}
export const deleteDocument= async (req: AuthRequest,res: Response,next:NextFunction): Promise<void> => {
    try {
        const userId= req.user!.id

        const workspaceId= req.params.workspaceId

        const documentId= req.params.id

        const workspace= await Workspace.findOne({'members.user': userId ,_id: workspaceId})

        if(!workspace) {
            res.status(404).json({success: false, message: 'Workspace not found'})
            return 
        }

        const document= await Document.findOne({
            _id: documentId,
            workspace: workspaceId  
        })

        if(!document) {
             res.status(404).json({success: false, message: 'Document not found'})
             return
        }

        const userPerm= workspace.hasPermission(userId,3)
        const isCreator= document.createdBy.toString() === userId.toString()
        
        if(!userPerm && !isCreator) {  
            res.status(403).json({success: false, message: 'You cant delete this document'})
            return 
        }

        await Document.deleteOne({_id: documentId})

        res.status(204).send()
    } catch(err) {
        next(err)
    }
}