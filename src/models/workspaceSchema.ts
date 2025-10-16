import mongoose , {Schema} from "mongoose"
import { IWorkspace, IWorkspaceMember, IWorkspaceInvite } from "../types"

const workspaceSchema= new Schema<IWorkspace>({
    name: {
        type: String,
        required: [true,'Workspace name is required'],
        trim: true,
        minLength: [3,'Name must be at least 3 characters']
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Workspace owner is required']
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: 'String',
            enum: ['owner','admin','editor','viewer'],
            default: 'viewer'
        },
        joinedAt: {
            type: Date,
            default: Date.now()
        }
    }],
    settings: {
        isPublic: {
            type: Boolean,
            default: false
        },
        allowedInvites: {
            type: Boolean,
            default: false
        },
        allowGuestAccess: {
        type: Boolean,
        default: false
        }
    },
    invites: [{
        email: {
            type: String,
            required: true
        },
        role: {
            type: String,
            enum: ['admin', 'editor', 'viewer'],
            default: 'viewer'
        },
        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        token: String,
        expiresAt: Date,
        status: {
            type: String,
            enum: ['pending','accepted','expired'],
            default: 'pending'
        },
        createdAt: {
            type: Date,
            default : Date.now()
        }
    }]
}, {timestamps: true, versionKey: false})

workspaceSchema.index({owner: 1})
workspaceSchema.index({'members.user': 1})
workspaceSchema.index({name: 'text', description: 'text'})

workspaceSchema.virtual('documentCount', {
        ref: 'Document',
        localField: '_id',
        foreignField: 'workspace',
        count : true
})
workspaceSchema.methods.isMember= function(userId: string): boolean {
    return this.members.some((m: IWorkspaceMember ) => 
         m.user.toString() === userId.toString())
}

workspaceSchema.methods.getUserRole= function(userId:string ) : string | null{
    const member= this.members.find((m: IWorkspaceMember) =>
      m.user.toString() === userId.toString())
    return member ? member.role : null
}


workspaceSchema.methods.hasPermission= function(userId: string,requireRole: number): boolean {
    const userRole = this.getUserRole(userId)
    const roleRanking : { [key: string]: number}= {owner: 4, admin: 3, editor: 2, viewer: 1}
    return userRole  !== null && roleRanking[userRole] >= requireRole
}



const Workspace=  mongoose.model<IWorkspace>('Workspace', workspaceSchema);

export default Workspace