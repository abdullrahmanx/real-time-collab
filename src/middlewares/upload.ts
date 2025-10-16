import cloudinary from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage=  new CloudinaryStorage({
    cloudinary: cloudinary.v2,
    params: {
        folder: "avatar",
        allowed_formats: ['jpg', 'jpeg', 'png']
    } as any
});

const fileFilter= (req: any,file: any,cb: any): void => {
    if(file.mimetype.startsWith('image/')){
        cb(null,true)
    }else {
         cb(new Error("Only images are allowed"), false)
    }
}

const upload= multer({storage, fileFilter: fileFilter})
export default upload




