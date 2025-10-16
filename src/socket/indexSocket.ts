import {Server}from 'socket.io'
import jwt from 'jsonwebtoken'
import Workspace from '../models/workspaceSchema'
import Document from '../models/documentSchema'
const documentMembers= new Map()
import { Response,NextFunction } from "express"

const canUserAccessDocument= async (requiredPermission='view',documentId: string,userId: string) => {
    const document= await Document.findById(documentId)
    if(!document) {
        return {allowed: false, message: 'Document not found'}
    }
    const workspace= await Workspace.findOne({'members.user': userId, _id: document.workspace})
    if(!workspace) {
        return {allowed: false, message: 'Workspace not found'}
    }
    if(requiredPermission=== 'view') {  
        const canView= document.permissions.canView.some((u: string) => u.toString() === userId.toString())
        const canEdit= document.permissions.canEdit.some((u: string) => u.toString() === userId.toString())
        const canComment= document.permissions.canComment.some((u: string) => u.toString() === userId.toString())
        const createdBy= document.createdBy.toString() === userId.toString()
        if(!canView && !canEdit && !canComment && !createdBy) {
            return {allowed: false, message: 'You cant view this document'}
        }
    }
    if(requiredPermission=== 'edit') {  
        const canEdit= document.permissions.canEdit.some((u: string) => u.toString() === userId.toString())
        const createdBy= document.createdBy.toString() === userId.toString()
        if(!createdBy && !canEdit ) {
            return {allowed: false, message: 'You cant edit this document'}
        }
    }

    return {allowed: true, document, workspace}

}


export const initializeSocketServer= (server: any) => {
    const io = new Server(server,{
        cors: {
            origin: [ process.env.FRONTEND_URL as string,'http://127.0.0.1:5500'],
            methods: ['GET','POST'],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    })

    io.use((socket: any,next: any) => {
        try {
            const token= socket.handshake.auth.token || socket.handshake.query.token 
            if(!token) {
                return next(new Error('Authentication is required'))
            }
            const decoded= jwt.verify(token, process.env.JWT_ACCESS as string) as {id: string,name: string}
            socket.userName= decoded.name
            socket.userId= decoded.id
            next()
        }catch(err: any) {
            next(new Error('Invalid or expired token'))
        }
    })

    io.on('connection', (socket: any) => {
        console.log(`User connected: ${socket.userName}`)
        socket.join(`user:${socket.id}`)

        socket.on('join-document', async ({documentId,userName,userAvatar}: {[key: string]: string | null}) => {
            try {
                if(!documentId) {
                    return socket.emit('error',{message: 'Document id is required'})
                }
                const check= await canUserAccessDocument('view',documentId,socket.userId)
                if(!check.allowed) {
                    return socket.emit('error',{message: 'You cant join this document'})
                }
                const room= `document:${documentId}`
                socket.join(room)
                
                socket.currentDocument= documentId
                if(!documentMembers.has(documentId)) {
                    documentMembers.set(documentId,[])
                }
                const userInfo= {
                    userId: socket.userId,
                    userName: socket.userName|| userName,
                    userAvatar: userAvatar || null
                }
                const members= documentMembers.get(documentId)
                if(!members.some((u: any) => u.socketId.toString() === socket.id.toString())) {
                    members.push({
                        ...userInfo,
                        socketId: socket.id
                    })
                }
                socket.emit('document-members',{ members})
                io.to(room).emit('user-joined',{message: `User joined: ${userName}`,members})
            } catch(err) {
                socket.emit('error', {message: 'Failed to join document'})
            }
        })

        socket.on('edit-document', async ({documentId,changes,position,content}: {[key: string]: string}) => {
            try {
                if(!documentId) {
                    return socket.emit('error',{message: 'Document id is required'})
                }
                const check= await canUserAccessDocument('edit',documentId,socket.userId)
                if(!check.allowed) {
                    return socket.emit('error',{message: 'You cant edit this document'})
                }
                const room=`document:${documentId}`
                socket.to(room).emit('edit',{
                    userId: socket.userId,
                    userName: socket.userName,
                    position,
                    changes,
                    content
                })
            }catch(err) {
                socket.emit('error',{message: 'Edit document failed'})
            }
        })
        socket.on('save-document',async ({documentId,content,title}: {[key: string]: string}) => {
            try {
                if(!documentId || !content) {
                    return socket.emit('error',{message: 'Document id and content are required'})
                }
                const check= await canUserAccessDocument('edit',documentId,socket.userId)
                if(!check.allowed) {
                    return socket.emit('error',{message: 'You cant save this document'})
                }
                const room=`document:${documentId}`
                const document= await Document.findById(documentId)
                
                if (!document) {
                    return socket.emit('error', { message: 'Document not found' });
                }

                if(title) document.title= title 
                document.content= content as any
                document.lastEditedBy= socket.userId
                document.version = (document.version || 0) + 1
                await document.save()
                socket.emit('save-success', {
                    message: 'Document saved',
                    version: document.version,
                    timestamp: new Date()
                })
                socket.to(room).emit('document-saved', {
                    savedBy: socket.userName,
                    version: document.version
                })

            }catch(err) {
                socket.emit('error',{message: 'Save document failed'})
            }
        })
        socket.on('leave-document', () => {
            if(!socket.currentDocument) return
            
            const room=`document:${socket.currentDocument}`
            const members= documentMembers.get(socket.currentDocument)
            if(members) {
                const index= members.findIndex((u: any) => u.socketId=== socket.id)
                if(index !== -1) {
                    members.splice(index,1)
                }
                if(members.length === 0) documentMembers.delete(socket.currentDocument)
            }
           
            io.to(room).emit('user-left', {
                message: `User: ${socket.userName} left`,
                userId: socket.userId,
                members
            })
            socket.leave(room)
            socket.currentDocument= null
        })

        socket.on('disconnect',() => {
            console.log(`User disconnected: ${socket.userName}`)
            if(socket.currentDocument) {
                const members = documentMembers.get(socket.currentDocument)
                const room=`document:${socket.currentDocument}`
                if(members) {
                    const index = members.findIndex((u: any) => u.socketId === socket.id)
                if(index !== -1) {
                    members.splice(index, 1)
                }
                if(members.length === 0) {
                    documentMembers.delete(socket.currentDocument)
                }
            }
            io.to(room).emit('user-left',{
                message: `User: ${socket.userName} disconnected`,
                userId: socket.userId,
                members
            })
            socket.leave(room)
            socket.currentDocument= null
        }})
    })

}