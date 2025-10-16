import mongoose , {Schema}from "mongoose";
import {IDocumentVersion} from '../types'
const documentVersionSchema= new Schema<IDocumentVersion>({
    document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: [true, 'Document is required']
    },
    title: {
        type: String,
        required: [true, 'Title is required']
    },
    content: {
        type: Object,
        required: [true, 'Content is required']
    },
    version: {
        type: Number,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
},{timestamps: true, versionKey: false})

documentVersionSchema.index({document: 1, version: -1})
const DocumentVersion= mongoose.model<IDocumentVersion>('DocumentVersion', documentVersionSchema);

export default DocumentVersion