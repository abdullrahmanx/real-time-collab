import Workspace from '../models/workspaceSchema'
import User from '../models/userSchema'
import { sendEmail } from '../utils/email'
import crypto from 'crypto'
import {Response,NextFunction } from 'express'
import { AuthRequest } from '../types'
import { removeListener } from 'process'




export const createWorkspace= async (req: AuthRequest,res: Response,next: NextFunction): Promise<void> => {
    try {
        const {name, description,settings} = req.body
        const userId= req.user!.id
        if(!name) {
            res.status(400).json({
                success: false,
                message: 'Workspace name is required'
            })
             return 
        }
        const workspace= await Workspace.create({
            name,
            description,
            owner: userId,
            members: [{
                user: userId,
                role: 'owner',
                joinedAt: new Date()
            }],
            settings: settings || {}
        })
        await workspace.populate('owner' , 'name email avatar')
        await workspace.populate('members.user', 'name email avatar')

        await workspace.save()
        res.status(201).json({
            success: true,
            message: 'Workspace created successfully',
            data: {workspace}
        })
    } catch(err : any) {
        console.log('Error: ',err.message)
        res.status(500).json({
            success: false,
            message: 'Failed to create workspace'
        });
    }
}
export const getWorkspaces= async (req: AuthRequest,res: Response): Promise<void> => {
    try {
        const userId= req.user!.id 
        const {page = 1, limit = 20, search}= req.query 
        const limitNum= Number(limit)
        const pageNum= Number(page)
        const query: {[key: string]: any}= {'members.user': userId}
        if(search) {
            query.$text= {$search: search}
        } 

        const workspaces= await Workspace.find(query)
            .select('name description owner  members.user members.role createdAt updatedAt')
            .populate('owner', 'name email avatar')
            .sort({createdAt: 1})
            .limit(limitNum)
            .skip((pageNum -1) * limitNum)
            
        
        const workspacesData= workspaces.map(({_id,name,description,owner,members,createdAt,updatedAt}) => ({
            id: _id,
            name,
            description,
            owner,
            role: members.find(m => m.user.toString() === userId.toString())?.role || null,
            membersCount: members.length,
            createdAt,
            updatedAt
        }))    
        const total= await Workspace.countDocuments(query)
        const totalPages= Math.ceil(total/limitNum)

        res.status(200).json({
            success: true,
            data: {
                workspaces: workspacesData,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages,
                    prevPage: pageNum > 1 ? pageNum - 1 : null,
                    nextPage: pageNum < totalPages ? pageNum + 1: null,
                }
            }
        
        })
    }catch(err: any) {
        console.log('Error: ',err.message)
        res.status(500).json({
            success: false,
            message: 'Get user workspaces failed'
        })
    }
}
export const getWorkspace= async (req: AuthRequest,res: Response,next: NextFunction): Promise<void> => {
    try {
        const userId= req.user!.id

        const id= req.params.id

        const workspace= await Workspace.findOne({_id: id,'members.user': userId})
            .select('name description owner  members.user members.role createdAt updatedAt')
            .populate('owner', 'name email avatar')

        if(!workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace not found'
            })
            return 
        }
        const userMember= workspace.members.find(m => m.user.toString() === userId.toString())
        const workspaceData = {
            id: workspace._id,
            name: workspace.name,
            description: workspace.description,
            owner: workspace.owner,
            membersCount: workspace.members.length,
            role: userMember?.role || null, 
            createdAt: workspace.createdAt,
            updatedAt: workspace.updatedAt
        };
        res.status(200).json({
            success: true,
            data: {
                workspaceData
            }
        })
    }catch(err){
        next(err)
    }
}

export const updateWorkspace= async(req: AuthRequest,res: Response,next: NextFunction): Promise <void> => {
    try {
        
        const userId= req.user!.id
        const id= req.params.id
        const { name, description, settings } = req.body
        
        const workspace= await Workspace.findOne({_id: id, 'members.user': userId})
            .populate('owner', 'name email avatar')
        if(!workspace) {
            res.status(404).json({
                success: false,
                message: 'Workspace not found'
            })
            return 
        }
        const checkUserPermission= workspace.hasPermission(userId,3)

        if(!checkUserPermission) {
            res.status(403).json({
                success: false,
                message: 'You are not authorized'
            })
            return 
        }
        if(name) workspace.name = name

        if(description) workspace.description= description

        if(settings) Object.assign(workspace.settings, settings);

        await workspace.save()

        res.status(200).json({
            success: true,
            message: 'Workspace updated successfully',
            data: {
                workspace
            }
        })
    }catch(err) {
        next(err)
    }
}

export const inviteMember= async (req: AuthRequest,res: Response,next: NextFunction): Promise <void> => {
    try {
        const userId= req.user!.id
        const {email, role= 'viewer',workspaceId}= req.body
        if(!email) {
            res.status(400).json({
                success: false,
                message: 'Email is required'
            })
            return 
        }
        const user= await User.findOne({email})
        if(!user) {
            res.status(400).json({
                success: false,
                message: 'User not found'
            })
            return 
        }
      
        const workspace= await Workspace.findOne({'members.user': userId, _id: workspaceId})
        if(!workspace){
            res.status(404).json({
                success: false,
                message: 'Workspace not found'
            })
            return 
        }
    
        const checkUserPermission = workspace.hasPermission(userId,3)
        if(!checkUserPermission) {
            res.status(400).json({
                success: false,
                message: 'You cant invite members'
            })
            return 
        }
   
        const alreadyInvited= workspace.invites.some(invite => invite.email === email)
        if(alreadyInvited) {
            res.status(400).json({
                success: false,
                message: 'User already invited'
            })
            return 
        }
        const token= crypto.randomBytes(32).toString('hex')
        const inviterUser= await User.findById(userId)
        workspace.invites.push({
            email,
            role,
            invitedBy: inviterUser!._id as any,
            token,
            expiresAt: new Date(Date.now() + 24 * 7 * 60 * 60 * 1000),
            status: 'pending',
            createdAt: new Date()
        })
        const inviteUrl= `${process.env.FRONTEND_URL}/workspaces/accept-invite/${token}`
        await sendEmail(user.email,'workspaceInvite',{name: user.name,
            inviterName: inviterUser!.name as any, workspaceName: workspace.name,url:inviteUrl 
        })
        await workspace.save()
        res.status(200).json({
            success: true,
            message: 'Invite sent successfully'
        })

    }catch(err) {
        next(err)
    }
}
export const acceptInvite= async(req: AuthRequest,res: Response,next: NextFunction): Promise<void> => {
    try {

        const userId= req.user!.id 
        const {token}= req.params

        const workspace= await Workspace.findOne({
            'invites.token': token,
            'invites.status': 'pending',
            'invites.expiresAt': {$gt : Date.now()}
        })
        if(!workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace not found'
            })
            return 
        }
        const invite= workspace.invites.find(invite => invite.token === token)
        if(!invite) {
            res.status(404).json({
                success: false,
                message: 'Invite not found'
            })
             return
        }
        const user= await User.findById(userId)
        if(!user) {
           res.status(404).json({
                success: false,
                message: 'User not found'
            })
             return 
        }
        if(invite.email !== user.email) {
            res.status(403).json({
                success: false,
                message: 'This invitation is for a different email address'
            })
            return 
        }
       
        const isMember= workspace.isMember(userId)
        if(isMember) {
           res.status(400).json({
                success: false,
                message: 'You are already a member in this workspace'
            })
            return 
        }
        workspace.members.push({
            user: userId as any,
            role: invite.role as any,
            joinedAt: new Date()
        })

        invite.status= 'accepted'

        await workspace.save()
        res.status(200).json({
            success: true,
            message: 'Successfully joined workspace',
            data: {
                workspace: {
                id: workspace._id,
                name: workspace.name,
                role: invite.role
                }
            }
        });
    } catch(err) {
        next(err)
    }
}
export const deleteWorkspace= async (req: AuthRequest,res: Response,next: NextFunction): Promise <void> => {
    try {
        const userId= req.user!.id;
        const workspaceId= req.params.id;

        const workspace= await Workspace.findOne({_id : workspaceId, 'members.user': userId})
        if(!workspace) {
            res.status(404).json({
                success: false,
                message: 'Workspace not found'
            })
            return 
        }
        const checkUserPermission= workspace.hasPermission(userId,4)
        if(!checkUserPermission) {
            res.status(403).json({
                success: false,
                message: 'You are not authorized'
            })
            return 
        }
        
        const deleteWorkspace= await Workspace.deleteOne({_id: workspaceId})
        if(deleteWorkspace.deletedCount === 0) {
            res.status(500).json({
                success: false,
                message: 'Deletion failed,  Workspace not found during delete operation.'
            })
            return 
        }
        res.status(204).send();
    }catch(err) {
        next(err)
    }
}
export const getMembers= async (req: AuthRequest,res: Response,next: NextFunction): Promise<void> => {
    try {
        const userId= req.user!.id
        const workspaceId = req.params.id
        const workspace= await Workspace.findOne({_id: workspaceId, 'members.user': userId}).populate('members.user', 'name email avatar')
        if(!workspace) {
            res.status(404).json({
                    success: false,
                    message: 'Workspace not found'
            })
            return 
        }
        const members= workspace.members.map(({user,role,joinedAt}: any) => ({
            id: user?._id,
            name: user?.name,
            email: user?.email,
            avatar: user?.avatar,
            role,
            joinedAt
        }))

        res.status(200).json({
            success: true,
            data: {
                members: members,
                totalCount: members.length
            }
        })
    } catch(err) {
        next(err)
    }
}
export const updatedMember= async (req: AuthRequest,res: Response,next: NextFunction): Promise<void> => {
    try {
        const userId= req.user!.id
        const memberId= req.params.id
        const workspaceId= req.params.workspaceId
        const {role} = req.body
        if(!['owner','admin','editor','viewer'].includes(role)) {
            res.status(400).json({
                success: false,
                message: 'Invalid role'
            })
            return 
        }
        const workspace= await Workspace.findOne({'members.user': userId, _id: workspaceId})
        if(!workspace) {
            res.status(404).json({
                success: false,
                message: 'Workspace not found'
            })
            return 
        }
        if(workspace.owner.toString() === memberId) {
            res.status(400).json({
                success: false,
                message: 'You cant change owner role'
            })
            return 
        }

        const checkUserPermission= workspace.hasPermission(userId,3)
        if(!checkUserPermission) {
            res.status(403).json({
                success: false,
                message: 'You are not authorized to do this action'
            })
            return 
        }
        const member= workspace.members.find(m => m.user.toString() === memberId.toString())
        if(!member) {
            res.status(404).json({
                super: false,
                message: 'Member not found'
            })
            return 
        }
        member.role = role
        await workspace.save()
        res.status(200).json({
            success: true,
            message: 'Member updated successfully',
            data: {
                memberId,
                role
            }
        })
    }catch(err) {
        next(err)
    }
}
export const removeMember= async (req: AuthRequest,res: Response,next: NextFunction): Promise<void> =>{
    try {
        const userId= req.user!.id
        const memberId= req.params.id
        const workspaceId= req.params.workspaceId

        const workspace= await Workspace.findOne({'members.user': userId, _id: workspaceId})
        if(!workspace) {
            res.status(404).json({
                    success: false,
                    message: 'Workspace not found'
            })
            return 
        }
        const checkUserPermission= workspace.hasPermission(userId,3)
        if(!checkUserPermission) {
            res.status(403).json({
                    success: false,
                    message: 'You are not authorized to do this action'
            })
            return 
        }
        const isMember= workspace.isMember(memberId)
        if(!isMember) {
            res.status(404).json({
                success: false,
                message: 'Member is not in this workspace'
            })
            return 
        }
        workspace.members= workspace.members.filter(m => m.user.toString() !== memberId.toString())
       
        await workspace.save()

        res.json({
            success: true,
            message: 'Member removed successfully'
        });
    } catch(err) {
        next(err)
    } 
}
export const leaveWorkspace= async (req: AuthRequest,res: Response,next: NextFunction): Promise<void> => {
    try {
        const userId= req.user!.id 
        const workspaceId= req.params.id
        const workspace= await Workspace.findOne({'members.user': userId,_id: workspaceId})
        if(!workspace) {
            res.status(404).json({
                success: false,
                message: 'Workspace not found'
            })
            return 
        }
        if(workspace.owner.toString() === userId) {
            res.status(400).json({
                success: false,
                message: 'Owner cannot leave workspace. Transfer ownership first or delete workspace.'
            })
             return
        }
        workspace.members= workspace.members.filter(m => m.user.toString() !== userId.toString())
        await workspace.save()
        res.status(200).json({
            success: true,
            message: 'Successfully left workspace'
        })
    } catch(err) {
        next(err)
    }
}