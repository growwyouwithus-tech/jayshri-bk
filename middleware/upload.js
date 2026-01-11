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
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
        // resource_type: 'auto' is important for PDFs
        resource_type: 'auto'
    }
});

// File filter (Optional as CloudinaryStorage has allowed_formats, but good for double checking)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (JPEG, JPG, PNG) and PDF are allowed!'), false);
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
const uploadDocuments = upload.fields([
    { name: 'aadharFront', maxCount: 1 },
    { name: 'aadharBack', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
    { name: 'passportPhoto', maxCount: 1 },
    { name: 'fullPhoto', maxCount: 1 }
]);

module.exports = {
    upload,
    uploadDocuments
};
