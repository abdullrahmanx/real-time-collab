import mongoose, {Schema} from "mongoose"
import {IFolder} from '../types'


const folderSchema=new Schema<IFolder>({
    name: {
        type: 'String',
        required: [true, 'Folder name is required'],
        unique: true
    },
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: [true,'Workspace is required']
    },
    parentFolder : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true,'User is required']
    },
    icon : {
        type: String,
        default: 'folder'
    }
}, {timestamps: true, versionKey: false})

folderSchema.index({workspace: 1,name: 1})
folderSchema.index({workspace: 1, parentFolder: 1})


folderSchema.virtual('document', {
    ref: 'Document',
    localField: '_id',
    foreignField: 'folder'
})

folderSchema.virtual('subfolders',{
    ref: 'Folder',
    localField: '_id',
    foreignField: 'parentFolder'
})

const Folder= mongoose.model('Folder',folderSchema)

export default Folder