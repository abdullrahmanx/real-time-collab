import Document from '../models/documentSchema'
import Workspace from '../models/workspaceSchema'
import DocumentVersion from '../models/documentVersion'
import { AuthRequest } from '../types'
import { Request,Response,NextFunction } from 'express'

export const getVersions= async (req:AuthRequest,res:Response,next: NextFunction): Promise<void> => {
    try {
    const userId= req.user!.id
    const workspaceId= req.params.workspaceId
    const documentId= req.params.id

    const {version,page=1,limit=10,sortBy='createdAt',sortOrder='desc'}= req.query
    
    const workspace= await Workspace.findOne({'members.user': userId, _id: workspaceId})
    if(!workspace) {
       res.status(404).json({success: false,message: 'Workspace not found'})
       return 
    }
    const document= await Document.findOne({_id: documentId,workspace: workspaceId})
    if(!document) {
        res.status(404).json({success: false,message: 'Document not found'})
        return 
    }
    const query: {[key: string]: string | number}= {document: documentId}
    if(version) query.version=Number(version)
    const pageNum=Number(page)
    const limitNum= Number(limit)
    const skip= (pageNum- 1) * limitNum
    const sort: {[key: string]: 1 | -1}= {}
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1
    
    const documentVersions= await DocumentVersion.find(query)
        .select('-content')
        .sort(sort)
        .limit(limitNum)
        .skip(skip)
        .populate('document', 'title')
        .populate('createdBy', 'name email avatar')
    
    const total= await DocumentVersion.countDocuments(query)
    const totalPages= Math.ceil(total/limitNum)

    res.status(200).json({
        success: true,
        data: {
            documentVersions
        }, pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages,
            prevPage: pageNum < 1 ? pageNum - 1 : null,
            nextPage: pageNum < totalPages ? pageNum + 1 : null,
        }
    })

    }catch(err) {
        next(err)
    }
}
export const getVersion= async (req: AuthRequest,res: Response,next: NextFunction): Promise<void> => {
    try {
    const documentId= req.params.id
    const workspaceId= req.params.workspaceId
    const versionId= req.params.versionId
    const userId= req.user!.id

    const workspace= await Workspace.findOne({'members.user': userId, _id: workspaceId})

    if(!workspace) {
        res.status(404).json({success: false,message: 'Workspace not found'})
        return 
    }
    const document= await Document.findOne({_id: documentId,workspace: workspaceId})
    if(!document) {
        res.status(404).json({success: false,message: 'Document not found'})
        return 
    }

    const documentVersion= await DocumentVersion.findOne({_id: versionId,document: documentId})
        .populate('document','title')
        .populate('createdBy', 'name email avatar')

    if(!documentVersion) {
        res.status(404).json({success: false, message: 'Version not found'})
        return 
    }
    res.status(200).json({
        success: true,
        data: {
            documentVersion
        }
    })
    }catch(err) {
        next(err)
    }
}

export const restoreVersion= async (req: AuthRequest,res: Response,next: NextFunction): Promise<void> => {
    try {
        const documentId= req.params.id
        const workspaceId= req.params.workspaceId
        const versionId= req.params.versionId
        const userId= req.user!.id

        const workspace= await Workspace.findOne({'members.user': userId, _id: workspaceId})

        if(!workspace) {
            res.status(404).json({success: false,message: 'Workspace not found'})
            return 
        }
        const document= await Document.findOne({_id: documentId,workspace: workspaceId})
        if(!document) {
            res.status(404).json({success: false,message: 'Document not found'})
            return 
        }
        const userPerm = workspace.hasPermission(userId, 2)

        const createdBy= document.createdBy.toString() === userId.toString()

        const canEdit= document.permissions.canEdit.some(u => u.toString() === userId.toString())

        if(!userPerm && !createdBy && !canEdit) {
            res.status(400).json({success: false, message: 'You cant restore the old version'})
            return 
        }

        const versionToRestore= await DocumentVersion.findOne({_id: versionId,document: documentId})
        if(!versionToRestore) {
            res.status(404).json({
                success: false,
                message: 'Version not found'
            })
            return 
        }
        document.title= versionToRestore.title
        document.content= versionToRestore.content
        document.version+= 1  as any
        document.lastEditedBy= userId as any
        const newVersion= await DocumentVersion.create({
            document: documentId,
            title: document.title,
            content: document.content,
            version: document.version,
            createdBy: userId
        })

        await document.save()
        await document.populate('createdBy','name email avatar')
        await document.populate('lastEditedBy','name email avatar')
        await newVersion.populate('createdBy', 'name email avatar')

        res.status(200).json({
            success: true,
            message: `Document version restored form ${versionToRestore.version} now: ${document.version}`,
            data: {
                document,
                newVersion
            }
        })
    }catch(err) {
        next(err)
    }
}