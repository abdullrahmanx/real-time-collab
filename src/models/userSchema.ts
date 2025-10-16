import mongoose , {Schema} from "mongoose"
import validator from 'validator'
import bcrypt from 'bcryptjs'
import { IUser } from '../types'



const userSchema= new Schema<IUser>({
    name: {
        type: String,
        required: [true,'Name is required'],
        trim: true
    },
    email: {
        type: String,
        unique: [true,'Email already used'],
        lowercase: true,
        required: [true,'Email is required'],
        validate: {
            validator: function (v: string) {
                return validator.isEmail(v)
            },
            message: "Please provide a valid email address"
        }
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    emailVerified: {
        type: Boolean,
        default : false
    },
    verificationToken: {
        type: String
    },
    verificationLinkExpires: {
        type: Date
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    refreshTokens: [{
        token: String,
        createdAt: Date
    }],
    avatar : {
        type: String,
        default :null
    },
}, {timestamps: true, versionKey: false})


userSchema.pre('save', async function(this: IUser,next) {
    if(!this.isModified('password')) return next()
    this.password= await bcrypt.hash(this.password,10)
    next()   
})

userSchema.methods.comparePassword= async function(userPassword: string): Promise<boolean> {
    return await bcrypt.compare(userPassword,this.password)
}
const User= mongoose.model<IUser>('User',userSchema)
export default User