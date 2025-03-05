import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath || !fs.existsSync(localFilePath)) {
      throw new Error(`File not found: ${localFilePath}`);
    }

    console.log(`Uploading file to Cloudinary: ${localFilePath}`);

    const absoluteFilePath = path.resolve(localFilePath);
    console.log(`Absolute file path: ${absoluteFilePath}`);

    const response = await cloudinary.uploader.upload(absoluteFilePath, {
      resource_type: "auto",
    });
console.log(response)
    //console.log("File uploaded successfully:", response.secure_url);
    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    console.error("Error uploading file to Cloudinary:", error.message);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    throw new Error(`Error uploading to Cloudinary: ${error.message}`);
  }
};

export { uploadOnCloudinary };
