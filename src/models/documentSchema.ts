import mongoose, {Schema} from "mongoose";
import { IDocument,IDocumentContent } from "../types";


const documentSchema= new Schema<IDocument>({
    title: {
        type: String,
        required: [true,'Title is required'],
    },
    content: {
        type: Object,
        default: {
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: []
                }
            ]
        }
    },
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: [true, 'Workspace is required']
    },
    folder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Created by is required']
    },
    lastEditedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    version: {
        type: Number,
        default: 1
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    publicSlug: {
        type: String,
        unique: true, 
        sparse: true
    },
    permissions: {
        canEdit: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        canComment: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        canView: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    },
    metaData: {
        wordCount: {type: Number, default: 0},
        characterCount: {type: Number, default: 0},
        readTime: {type: Number, default: 0}
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    }
},{timestamps: true, versionKey: false})

documentSchema.index({title: 'text'});
documentSchema.index({workspace: 1, createdAt: -1});
documentSchema.index({folder: 1});
documentSchema.index({ createdBy: 1 });


documentSchema.pre('save', function(this: IDocument,next) {
    if(this.isModified('content')) {
        const text= this.extractTextFromContent(this.content );
        this.metaData.wordCount= text.split(/\s+/).filter(Boolean).length;
        this.metaData.characterCount= text.length;  
        this.metaData.readTime= Math.ceil(this.metaData.wordCount / 200);
    }
    next();
})

documentSchema.methods.extractTextFromContent= function (content: IDocumentContent): string {
    if (!content || !content.content) return '';  
    
    let text= '';
    function traverse(node: any) {
        if(node.type === 'text') {
            text += node.text + ' ';
        }
        if(node.content && Array.isArray(node.content)) {
            node.content.forEach(traverse);
        }
    }
    traverse(content);
    return text.trim();
}

const Document= mongoose.model<IDocument>('Document',documentSchema);
export default Document