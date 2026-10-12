const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Setup storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'file-' + uniqueSuffix + ext);
    }
});

// File filter supporting common images, documents, and media
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const allowedExts = [
        'jpeg', 'jpg', 'png', 'webp', 'gif', 'bmp', 'svg', 'jfif', 'pjpeg', 'pjp', 'avif',
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt',
        'webm', 'mp3', 'wav', 'ogg', 'mp4', 'mov'
    ];
    const isImage = file.mimetype.startsWith('image/');
    const isDoc = file.mimetype.includes('pdf') || 
                  file.mimetype.includes('document') || 
                  file.mimetype.includes('msword') || 
                  file.mimetype.includes('wordprocessingml') ||
                  file.mimetype.includes('sheet') ||
                  file.mimetype.includes('excel') ||
                  file.mimetype.includes('presentation') ||
                  file.mimetype.includes('text/');
    const isMedia = file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/');

    if (allowedExts.includes(ext) || isImage || isDoc || isMedia) {
        return cb(null, true);
    } else {
        cb(new Error(`File type .${ext} is not allowed`));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
    fileFilter: fileFilter
});

module.exports = upload;
