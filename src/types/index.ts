import { Request } from "express";
import { Document, Types } from 'mongoose'

export interface AuthRequest extends Request{
    user?: {
        id: string,
        email: string
    }
}


export interface IUser extends Document {
    name: string,
    email: string,
    password: string,
    emailVerified: boolean,
    verificationToken?: string,
    verificationLinkExpires?: Date,
    resetPasswordToken?: string,
    resetPasswordExpires?: Date,

    refreshTokens: Array<{
        token: string,
        createdAt: Date
    }>
    avatar?: string

    createdAt: Date;
    updatedAt: Date;
    comparePassword(userPassword: string): Promise<boolean>
}

export interface IWorkspaceMember {
    user: Types.ObjectId
    role: 'owner' | 'admin' | 'editor' | 'viewer'
    joinedAt: Date
}
export interface IWorkspaceInvite {
    email: string
    role: 'admin' | 'editor' | 'viewer'
    invitedBy: Types.ObjectId
    token?: string
    expiresAt?: Date 
    status: 'pending' | 'accepted' | 'expired'
    createdAt: Date
}

export interface IWorkspaceSettings {
    isPublic: boolean,
    allowedInvites: boolean,
    allowedGuestAccess: boolean
}

export interface IWorkspace extends Document {
    name: string
    description?: string
    owner: Types.ObjectId
    members: IWorkspaceMember[]
    settings: IWorkspaceSettings
    invites: IWorkspaceInvite[]
    createdAt: Date
    updatedAt: Date
    isMember(userId: string): boolean
    getUserRole(userRole: string): string | null 
    hasPermission(userRole: string, requiredRole: number): boolean 
}

export interface IDocumentPermissions {
    canEdit: string[]
    canComment: string[]
    canView: string[]
}

export interface IDocumentText {
    type: 'text'
    text: string
}

export interface IDocumentParagraph {
    type: 'paragraph'
    content: IDocumentText[]
}

export interface IDocumentContent {
    type: 'doc'
    content: IDocumentParagraph[]
}

export interface IDocumentMetadata {
    wordCount: number
    characterCount: number
    readTime: number
}

export interface IDocument extends Document {
    title: string
    content: IDocumentContent
    workspace: Types.ObjectId
    folder?: Types.ObjectId
    createdBy: Types.ObjectId
    lastEditedBy?: Types.ObjectId
    version?: number
    isPublic: boolean;
    publicSlug?: string;
    permissions: IDocumentPermissions;
    metaData: IDocumentMetadata
    status: 'draft' | 'published' | 'archived'
    createdAt: Date
    updatedAt: Date
    extractTextFromContent(content: IDocumentContent): string
}

export interface IFolder extends Document {
  name: string
  workspace: Types.ObjectId
  parentFolder?: Types.ObjectId
  createdBy: Types.ObjectId
  icon?: string
  createdAt: Date
  updatedAt: Date
}



export interface IDocumentVersion extends Document {
  document: Types.ObjectId
  title: string
  content: IDocumentContent
  version: number
  createdBy: Types.ObjectId
  createdAt: Date
}
