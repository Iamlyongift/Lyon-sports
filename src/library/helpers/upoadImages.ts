import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import adminRequest from "../../types/userRequest";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer-storage-cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: adminRequest, file: Express.Multer.File) => {
    return {
      folder: "Image_Uploads",
      format: "jpeg", // Optional: set the file format to jpeg
      public_id: file.originalname.split(".")[0], // Optional: set the public ID to the file name without extension
    };
  },
});

// Initialize multer with Cloudinary storage
export const upload = multer({ storage: storage });
