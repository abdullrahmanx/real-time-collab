import nodemailer from 'nodemailer'

const createTransporter= () => {
    // if (process.env.NODE_ENV === 'production') {
    //     return nodemailer.createTransport({
    //             service: 'gmail',
    //             auth: {
    //                 user: process.env.EMAIL_USER,
    //                 pass: process.env.EMAIL_PASS
    //             }
    //         })
    // } else {
        
        return nodemailer.createTransport({
            host: process.env.MAILTRAP_HOST,
            port: 587,
            auth: {
                user: process.env.MAILTRAP_USER,
                pass: process.env.MAILTRAP_PASS
            }
        })
            
    }

const templates= {
    verification: (name:string,url:string) => ({
        subject: 'Verify Your Email',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #4F46E5; color: white; padding: 20px; text-align: center;">
                <h1>Welcome ${name}!</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9;">
                <p>Thanks for registering! Click below to verify your email:</p>
                <a href="${url}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Verify Email</a>
                <p style="color: #666; font-size: 14px;">Link expires in 24 hours</p>
                <p style="color: #666; font-size: 12px;">If you didn't create an account, ignore this email.</p>
                </div>
            </div>
    `
    }),
    workspaceInvite: (name:string,inviterName:string,workspaceName:string,url:string) => ({
        subject: `${inviterName} invited you to ${workspaceName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto;">
            <div style="background: #10B981; color: white; padding: 20px; text-align: center;">
                <h1>Workspace Invitation</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
                <p>Hi ${name},</p>
                <p><strong>${inviterName}</strong> has invited you to join the <strong>${workspaceName}</strong> workspace!</p>
                <p>Click below to accept the invitation:</p>
                <a href="${url}" style="display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Accept Invitation</a>
                <div>${url}</div>
                <p style="color: #666; font-size: 12px;">This invitation expires in 7 days.</p>
            </div>
            </div>
        `
    }),
    password: (name:string,url:string) => ({
        subject: 'Reset your password',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #EF4444; color: white; padding: 20px; text-align: center;">
                <h1>Reset Password</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9;">
                <p>Hi ${name},</p>
                <p>Click below to reset your password:</p>
                <a href="${url}" style="display: inline-block; background: #EF4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
                <p style="background: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B;">
                    <strong>⚠️ Link expires in 15 minutes</strong>
                </p>
                <p style="color: #666; font-size: 12px;">Didn't request this? Ignore this email.</p>
                </div>
            </div>
        `
    })
}

export const sendEmail = async (to:string,type:string,data: any) => {
    try {
        let template
        switch (type) {
            case 'verification':
                template= templates.verification(data.name,data.url as string)
                break
            case 'password':
                template= templates.password(data.name,data.url)  
                break 
            case 'workspaceInvite':
                template= templates.workspaceInvite(data.name,data.inviterName,data.workspaceName,data.url)
                break
            default:
                throw new Error('Invalid email type');    
        }
        const transporter= await createTransporter()
        await transporter.sendMail({
            from: 'Collaboration Platform, <noreply@example.com>',
            to,
            subject: template.subject,
            html: template.html
        })
        console.log('Email sent', to)
        console.log('Email subject', template.subject)
    
        return { success: true , message: 'Email sent'} ;
    } catch(err: any) {
        return { success: false, error: err.message };
    }
}

