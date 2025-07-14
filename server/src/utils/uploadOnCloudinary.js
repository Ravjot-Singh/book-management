import { v2 as cloudinary } from "cloudinary"
import fs from "fs"


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
      //      console.log("not file path received ")
            return null
        }


        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            format:"pdf",
            flags:"attachment"
        })
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
    //    console.log("NO file to upload : ", error)
        fs.unlinkSync(localFilePath) 
        return null;
    }
}



export { uploadOnCloudinary }