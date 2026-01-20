const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
// Note: If these env vars are missing, uploads will fail, but the app won't crash on startup.
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'jaishree-colony/documents',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'tiff', 'pdf'],
        // resource_type: 'auto' is important for PDFs
        resource_type: 'auto'
    }
});

// File filter (Optional as CloudinaryStorage has allowed_formats, but good for double checking)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif|bmp|svg|tiff|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (JPEG, JPG, PNG, WEBP, GIF, BMP, SVG, TIFF) and PDF are allowed!'), false);
    }
};

// Create multer upload instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Increased to 5MB
    },
    fileFilter: fileFilter
});

// Middleware for multiple document uploads
// Using .any() to support dynamic field names for multiple owners
// Field names will be like: owner_0_aadharFront, owner_1_aadharFront, logo, etc.
const uploadDocuments = upload.any();

module.exports = {
    upload,
    uploadDocuments
};
