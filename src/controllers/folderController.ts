import Folder from '../models/folderSchema'
import Document from '../models/documentSchema';
import Workspace from '../models/workspaceSchema';
import {Response,NextFunction} from 'express'
import {AuthRequest} from '../types'



export const createFolder= async (req: AuthRequest,res: Response,next: NextFunction): Promise<void> => {
    try {
        const {name,parentFolder} = req.body
        const workspaceId=req.params.workspaceId
        const userId= req.user!.id
        
        const workspace= await Workspace.findOne({'members.user': userId, _id: workspaceId})
        if(!workspace) {
            res.status(404).json({success: false,message: 'Workspace not found'})
            return
        }

        const userPerm= workspace.hasPermission(userId,2)
        if(!userPerm) {
            res.status(403).json({success: false,message: 'You cant create a folder'})
            return
        }

        if(parentFolder) {
            const folderExists= await Folder.findOne({_id: parentFolder})
            if(!folderExists) {
                res.status(404).json({success: false, message: 'Parent folder not found'})
                return
            }
        }
        const newFolder= await Folder.create({
            name,
            workspace: workspaceId,
            parentFolder: parentFolder || null,
            createdBy: userId
        })

        await newFolder.populate('createdBy','name')

        res.status(201).json({
            success: true,
            message: 'Folder created successfully',
            data: {
                newFolder
            }
        })
    }catch(err) {
        next(err)
    }
}

export const getAllFolders= async (req: AuthRequest,res: Response,next: NextFunction): Promise<void> => {
    try {
    const workspaceId= req.params.workspaceId
    const userId= req.user!.id
    const {search,page = 1,limit = 10, sortBy= 'createdAt',sortOrder= 'desc'} = req.query

    const workspace= await Workspace.findOne({'members.user': userId, _id: workspaceId})

    if(!workspace) {
        res.status(404).json({success: false,message: 'Workspace not found'})
        return 
    }

    const query: any = {workspace: workspaceId}
    if(search)  query.name=  { $regex: search, $options: 'i'}
    const sort:{ [key: string]: 1  | -1} = {}
    sort[sortBy as string]= sortOrder === 'asc' ? 1 : -1
    const pageNum= Number(page)
    const limitNum= Number(limit)
    const skip = (pageNum -1 ) * limitNum
    
    const folders= await Folder.find(query).sort(sort).limit(limitNum).skip(skip)
        .populate('workspace', 'name')
        .populate('createdBy','name')
        .populate('parentFolder','name')

    const total= await Folder.countDocuments(query)
    
    const totalPages= Math.ceil(total / limitNum)

    res.status(200).json({
        success: true,
        data: {
            folders,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages,
                prevPage: pageNum > 1 ? pageNum - 1 : null,
                nextPage: pageNum < totalPages ? pageNum + 1 : null
            }
        }
    })
}   catch(err) {
        next(err)
    }
}

export const getFolder= async (req: AuthRequest,res: Response,next: NextFunction): Promise<void> => {
    try {
        const userId= req.user!.id
        const workspaceId= req.params.workspaceId
        const folderId= req.params.id

        const workspace= await Workspace.findOne({'members.user': userId,_id: workspaceId})
        if(!workspace) {
            res.status(404).json({success: false,message: 'Workspace not found'})
            return
        }

        const folder= await Folder.findOne({_id: folderId, workspace: workspaceId})
            .populate('createdBy', 'name')
            .populate('workspace','name')
        if(!folder) {
            res.status(404).json({success: false,message: 'Folder not found'})
            return 
        }
        res.status(200).json({
            success: true,
            data: {folder}
        })
    }catch(err) {
        next(err)
    }
}

export const updateFolder = async (req: AuthRequest,res: Response, next: NextFunction): Promise<void> => {
    try {
    const userId = req.user!.id 
    const workspaceId= req.params.workspaceId
    const folderId= req.params.id
    const {name, parentFolder} = req.body

    const workspace= await Workspace.findOne({_id: workspaceId,'members.user': userId})
    if(!workspace) {
        res.status(404).json({
            success: false,
            message: 'Workspace not found'
        })
        return
    }

    const checkPerm= workspace.hasPermission(userId,2)
    if(!checkPerm) {
        res.status(403).json({
            success: false,
            message: 'You cant update this folder'
        })
        return
    }

    const folder= await Folder.findOne({_id: folderId, workspace: workspaceId})
    if(!folder) {
        res.status(404).json({
            success: false,
            message: 'Folder not found'
        })
        return
    }
    
    if(name) folder.name = name

    if(parentFolder && parentFolder === folderId) {
        res.status(400).json({
            success: false,
            message: 'Cannot move folder inside itself'
        })
    }
    if(parentFolder !== undefined) {
        if(parentFolder) {
            const exists = await Folder.findOne({_id: parentFolder})
            if(!exists) {
                res.status(404).json({
                    success: false,
                    message: 'Parent folder not found'
                })
                return
            }
        }
        folder.parentFolder = parentFolder || null
    }

    await folder.save()
    await folder.populate('workspace', 'name')
    await folder.populate('createdBy','name')
    await folder.populate('parentFolder','name')

    res.status(200).json({
        success: true,
        message: 'Folder updated successfully',
        data: {
            folder
        }
    })
    }catch(err: any) {
        next(err)
    }
}

export const deleteFolder= async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId= req.user!.id
        const folderId= req.params.id
        const workspaceId= req.params.workspaceId

        const workspace= await Workspace.findOne({_id: workspaceId,'members.user': userId})
        if(!workspace) {
            res.status(404).json({
                success: false,
                message: 'Workspace not found'
            })
            return
        }
        
        const checkPerm= workspace.hasPermission(userId,3)
        if(!checkPerm) {
            res.status(403).json({
                success: false,
                message: 'You cant update this folder'
            })
            return
        }
        const folder= await Folder.findOne({_id: folderId,workspace: workspaceId})
        if(!folder) {
            res.status(404).json({
                success: false,
                message: 'Workspace not found'
            })
            return
        }

        const subFolders= await Folder.exists({parentFolder: folderId})
        const hasDocument= await Document.exists({folder: folderId})

        if(subFolders || hasDocument) {
            res.status(400).json({
                success: false,
                message: 'Cannot delete folder with subfolders or documents. Please remove them first'
            })
            return
        }

        await Folder.deleteOne({ _id: folderId, workspace: workspaceId });
        res.status(200).json({
            success: true,
            message: 'Folder deleted successfully'
        })

    }catch(err: any) {
        next(err)
    }

}
