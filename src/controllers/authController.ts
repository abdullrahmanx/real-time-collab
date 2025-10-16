import User from '../models/userSchema'
import jwt from 'jsonwebtoken'
import { sendEmail } from '../utils/email'
import crypto from 'crypto'
import { AuthRequest } from '../types'
import {Response, NextFunction} from  'express'

export const register= async (req: AuthRequest,res: Response,next: NextFunction): Promise <void> => {
    try {
        const {name,email,password} = req.body
        if(!email || !name || !password) {
            res.status(400).json({success: false,message: 'Name, email and password are required'})
            return 
        }

        if(password.length < 8) {
            res.status(400).json({success: false,message: 'Password must be atleast 6 characters'})
            return
        }

        if(name.length < 3) {
            res.status(400).json({success: false,message: 'Name must be atleast 3 characters'})
            return
        }

        const existingEmail= await User.findOne({email})
        if(existingEmail) {
             res.status(409).json({success: false,message: 'Email already exists'})
        }
        const verificationToken= crypto.randomBytes(32).toString('hex')
        const hash= crypto.createHash('sha256').update(verificationToken).digest('hex')
        const user= await User.create({name
            ,email,
            password,
            verificationToken: hash})

        const refreshToken= jwt.sign({id: user._id}, process.env.JWT_SECRET as string, {expiresIn: '7d'}) 
        const accessToken= jwt.sign({id: user._id,name: user.name},process.env.JWT_ACCESS as string, {expiresIn: '7d'})
        user.refreshTokens.push({
            token: refreshToken,
            createdAt: new Date()
        })

        const verifyUrl= `${process.env.FRONTEND_URL}/auth/verify-email/${verificationToken}`
        await sendEmail(user.email,'verification',{name: user.name,url:verifyUrl})
        user.verificationLinkExpires= new Date(Date.now()+ 24 *60 * 60 * 1000)
        await user.save()
        const userData= await User.findById(user._id).select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationLinkExpires -refreshTokens');

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please verify your email.',
            data: {
                user: userData,
                token : {
                    refreshToken,
                    accessToken,
                    expiresIn: '15m'
                }
            },
            
        })
    }catch (err: any) {
        next(err)
    }
}
export const verifyEmail= async (req: AuthRequest,res: Response,next: NextFunction): Promise <void> => {
    try {
        const {token} = req.params
        if (!token) {
           res.status(400).json({ success: false, message: 'Token required' });
            return 
        }
        const hash= crypto.createHash('sha256').update(token).digest('hex')
        const user = await User.findOne({verificationToken: hash,emailVerified: false})
        if(!user) {
            res.status(400).json({success: false,message: 'Invalid or expired token'})
            return 
        }
        if(user.verificationLinkExpires && user.verificationLinkExpires.getTime() < Date.now()) {
            res.status(400).json({ success: false,message: 'Verification link expired' });
            return
        }
        user.emailVerified= true,
        user.verificationToken = undefined;
        await user.save()
        res.status(200).json({
            success: true,
            message: 'Email verified successfully'
        })
    } catch(err: any) {
        next(err)
    }
}

export const resendVerification= async (req: AuthRequest,res: Response,next: NextFunction): Promise<void> => {
    try {
    const {email} =req.body
    if (!email) { 
        res.status(400).json({ success: false, message: 'Email required' })
        return
    }

    const user= await User.findOne({email})

    if(!user) { 
        res.status(400).json({ success: false, message: 'Invalid email' })
        return
    }

    if(user.emailVerified) {
        res.status(400).json({ success: false, message: 'Email already verified'});
        return 
    }
    if (user.verificationLinkExpires && user.verificationLinkExpires.getTime() > Date.now()) {
        res.status(400).json({success: false,message :'Email link not expired yet'})
        return 
    }
    const verifyToken= crypto.randomBytes(32).toString('hex')

    const hash= crypto.createHash('sha256').update(verifyToken).digest('hex')
    
    user.verificationToken= hash

    user.verificationLinkExpires =new Date(Date.now() + 24 * 60 * 60 * 1000)

    await user.save()

    const verifyUrl= `${process.env.FRONTEND_URL}/auth/verify-email/${verifyToken}`

    await sendEmail(user.email,'verification',{name: user.name,url: verifyUrl})

    res.status(200).json({
        success: true,
        message: 'Email verification send successfully'
    })
    } catch(err: any) {
        next
    }
}
export const login= async (req:AuthRequest,res:Response, next: NextFunction): Promise<void> => {
    try {
         const {email,password} = req.body
         if(!email || !password) {
            res.status(400).json({success: false,message: 'Email and password are required'})
            return 
        }
        
        const user= await User.findOne({email})

        if(!user) {
            res.status(401).json({success: false,message: 'Email or password are incorrect'})
            return 
        }
        const isMatch= await user.comparePassword(password)

        if(!isMatch) {
            res.status(401).json({success: false,message: 'Email or password are incorrect'})
            return 
        }
        
        if(!user.emailVerified) {
            res.status(401).json({success: false,message: 'Email verification required'})
            return 
        }

        
        const accessToken= jwt.sign({id: user._id,name: user.name}, process.env.JWT_ACCESS as string, {expiresIn: '7d'})    
        const refreshToken= jwt.sign({id: user._id}, process.env.JWT_SECRET as string, {expiresIn: '7d'})    
        user.refreshTokens.push({
            token: refreshToken,
            createdAt: new Date()
        })
        await user.save()
        const userData= await User.findById(user._id).select('-password -refreshTokens -verificationLinkExpires -emailVerified  -refreshToken -resetPasswordToken -resetPasswordExpires');
       
        res.status(200).json({
            success: true,
            data: {
               user: userData
            },
            token: {
                accessToken,
                refreshToken
            }
        })
    }catch(err: any){
        next(err)
    }
}
export const forgotPassword= async (req: AuthRequest,res: Response,next: NextFunction): Promise<void> => {
    try {
        const {email}= req.body
        if(!email) {
            res.status(400).json({success: false,message: 'Email is required'})
            return 
        }
        const user= await User.findOne({email})
        if(!user) {
            res.status(400).json({success: true,message: 'Reset link sent if email exists'})
            return 
        }
        
        const token= crypto.randomBytes(32).toString('hex')

        const hash= crypto.createHash('sha256').update(token).digest('hex')

        user.resetPasswordToken= hash

        user.resetPasswordExpires= new Date(Date.now() + 15 * 60 * 1000)
        
        const resetUrl= `${process.env.FRONTEND_URL}/auth/reset-password/${token}`

        await sendEmail(user.email,'password',{name: user.name, url: resetUrl})

        await user.save()
        res.status(200).json({ success: true, message: 'Reset link sent if email exists' });
    }catch(err: any) {
        next(err)
    }
}
export const resetPassword= async (req: AuthRequest,res: Response, next: NextFunction): Promise<void> => {
    try {
        const {token} = req.params
        const {newPassword}= req.body
        if (!token) {
             res.status(400).json({ success: false, message: 'Token required' });
             return
        }
        if(!newPassword) {
            res.status(400).json({success: false, message: 'New password required'})
             return
        }
        if(newPassword.length < 8) {
             res.status(400).json({success: false, message: 'Password must be atleast 8 characters'})
             return
        }
        const hash= crypto.createHash('sha256').update(token).digest('hex')
        const user= await User.findOne({resetPasswordToken: hash,
            resetPasswordExpires: { $gte : Date.now()}
        })
        if (!user) {
            res.status(400).json({ success: false, message: 'Invalid or expired token' });
            return
        }
        user.password= newPassword
        user.resetPasswordToken= undefined
        user.resetPasswordExpires = undefined;
        user.refreshTokens= [];
        await user.save()

        res.status(200).json({
            success: true,
            message: 'Password reset successful. Please login.'
        })
    } catch(err: any) {
        next(err)
    }
}

export const changePassword = async (req: AuthRequest, res: Response,next: NextFunction): Promise<void> => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user!.id;

        if (!currentPassword || !newPassword) {
            res.status(400).json({ success: false, message: 'New and current password are required' });
            return;
        }

        if (newPassword.length < 8) {
            res.status(400).json({ success: false, message: 'Password must be atleast 8 characters' });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            res.status(400).json({ success: false, message: 'Current password is incorrect' });
            return;
        }

        user.password = newPassword;
        user.refreshTokens = [];
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password change successful. Please login.'
        });
    } catch (err: any) {
        next(err)
    }
};


export const profile = async (req: AuthRequest, res: Response,next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.id;

        const userData = await User.findById(userId).select('-password -verificationLinkExpires -emailVerified -refreshTokens');
        if (!userData) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        res.status(200).json({
            success: true,
            data: {
                user: userData
            }
        });
    } catch (err: any) {
        next(err)
    }
};
export const updateProfile = async (req: AuthRequest, res: Response,next: NextFunction): Promise<void> => {
    try {
        const { name, email } = req.body;
        const userId = req.user!.id;

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        if (name) user.name = name;

        if (email === user.email) {
            res.status(400).json({ success: false, message: 'Email already used' });
            return;
        }

        if (email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                res.status(400).json({
                    success: false,
                    message: 'Email is already in use by another account'
                });
                return;
            }

            user.emailVerified = false;
            user.email = email;

            const token = crypto.randomBytes(32).toString('hex');
            const hash = crypto.createHash('sha256').update(token).digest('hex');

            user.verificationToken = hash;
            user.verificationLinkExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

            const verifyUrl = `${process.env.FRONTEND_URL}/auth/verify-email/${token}`;
            await sendEmail(user.email, 'verification', { name: user.name, url: verifyUrl });
        }

        if (req.file) {
            user.avatar = req.file.path;
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                emailVerified: user.emailVerified,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (err: any) {
        console.log('Error: ', err.message);
        res.status(500).json({ success: false, message: 'Profile update failed' });
    }
};

export const refreshToken= async (req: AuthRequest,res: Response,next: NextFunction): Promise<void> => {
    try {
        const {refreshToken} = req.body
        if (!refreshToken) {
            res.status(400).json({
                success: false,
                message: 'Refresh token required'
            });
            return 
        }
        let decoded: any
        try {
            decoded= jwt.verify(refreshToken,process.env.JWT_SECRET as string)
        } catch(err){
                res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token'
            });
             return 
        }
        const user= await User.findById(decoded.id)
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User not found'
            });
            return 
        }
        const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
        if (!tokenExists) {
            res.status(401).json({
                success: false,
                message: 'Refresh token no longer valid (maybe user logged out)'
            });
            return 
        }
        user.refreshTokens= user.refreshTokens.filter((t) => t.token !== refreshToken)
        const accessToken= jwt.sign({id: user._id,name: user.name},
            process.env.JWT_ACCESS as string,{expiresIn: '15m'})
        const newRefreshToken = jwt.sign({ id: user._id },
            process.env.JWT_SECRET as string ,{ expiresIn: '7d' });

        user.refreshTokens.push({
            token: newRefreshToken,
            createdAt: new Date()
        })
        await user.save()    
        res.status(200).json({
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    token: {
                    accessToken,
                    refreshToken: newRefreshToken,
                    expiresIn: '15m'
                    }
                }
        });
    }catch(err: any) {
        next(err)
    }
}
export const logout= async (req: AuthRequest,res: Response,next: NextFunction): Promise<void> => {
    try {
        const {refreshToken} = req.body
        const userId= req.user!.id
        if (!refreshToken) {
                res.status(400).json({
                    success: false,
                    message: 'Refresh token required'
                });
                 return 
        }
        let decoded= jwt.verify(refreshToken,process.env.JWT_SECRET as string) as {id: string, name: string}
        const user= await User.findById(userId)
        if (!user) { 
            res.status(404).json({ success: false, message: 'User not found' })
            return
        };
        const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
        if (!tokenExists) {
            res.status(401).json({
                success: false,
                message: 'Already logged out or invalid refresh token',
            });
            return 
        }
        user.refreshTokens= user.refreshTokens.filter((t) => t.token !== refreshToken)
        await user.save()
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }catch(err: any) {
       next(err)
    }
}
export const logoutAllSessions = async (req: AuthRequest, res: Response,next: NextFunction): Promise<void> => {
  try {

    const userId= req.user!.id
    
    const {refreshToken,keepCurrent} = req.body || {}

    const user= await User.findById(userId)
    if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }

    if(keepCurrent && refreshToken) {
        user.refreshTokens= user.refreshTokens.filter((t) => t.token === refreshToken)
    } else {
        user.refreshTokens= []
    }

    await user.save()

    res.status(200).json({
        success: true,
        message: keepCurrent && refreshToken ? 
        'All other sessions logged out': 'Logged out from all devices successfully'
    })

  } catch (err: any) {
        next(err)
  }
}
export const logoutSession= async (req: AuthRequest,res: Response, next: NextFunction): Promise <void> => {
    try {
        const userId= req.user!.id
        const {refreshToken} = req.body
        const user= await User.findById(userId)
        if(!user) {
            res.status(404).json({success: false,message: 'User not found'})
            return 
        }
        const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
        if (!tokenExists) {
            res.status(400).json({
                success: false,
                message: 'Session not found or already logged out',
            });
            return 
        }
        user.refreshTokens= user.refreshTokens.filter((t) => t.token !== refreshToken)
        await user.save()
        res.status(200).json({
            success: true,
            message: 'Session removed successfully'
        });

    } catch(err: any) {
        next(err)
    }
}