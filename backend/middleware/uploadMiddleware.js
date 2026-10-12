const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Ensure public and private upload directories exist
const baseUploadsDir = path.join(__dirname, '..', 'uploads');
const publicUploadsDir = path.join(baseUploadsDir, 'public');
const privateUploadsDir = path.join(baseUploadsDir, 'private');

for (const dir of [baseUploadsDir, publicUploadsDir, privateUploadsDir]) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isPrivate = req.query.private === 'true' || 
                          req.body?.visibility === 'private' ||
                          req.body?.is_private === 'true' ||
                          req.body?.is_private === true ||
                          req.baseUrl?.includes('kyc') || 
                          req.path?.includes('private') || 
                          req.path?.includes('secure');
        cb(null, isPrivate ? privateUploadsDir : publicUploadsDir);
    },
    filename: (req, file, cb) => {
        const isPrivate = req.query.private === 'true' || 
                          req.body?.visibility === 'private' ||
                          req.body?.is_private === 'true' ||
                          req.body?.is_private === true ||
                          req.baseUrl?.includes('kyc') || 
                          req.path?.includes('private') || 
                          req.path?.includes('secure');
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
        const ext = path.extname(file.originalname).toLowerCase();
        const prefix = isPrivate ? `sec_${req.user?.id || 'anon'}_` : 'file-';
        cb(null, prefix + uniqueSuffix + ext);
    }
});

// File filter strictly disallowing executables, scripts, and dangerous SVGs
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const dangerousExts = [
        'php', 'phtml', 'phar', 'html', 'htm', 'js', 'jsp', 'asp', 'aspx',
        'exe', 'sh', 'bat', 'cmd', 'cgi', 'pl', 'svg' // SVG forbidden to prevent Stored XSS
    ];

    if (dangerousExts.includes(ext)) {
        return cb(new Error(`File extension .${ext} is strictly forbidden for security reasons.`));
    }

    const allowedExts = [
        'jpeg', 'jpg', 'png', 'webp', 'gif', 'bmp', 'jfif', 'pjpeg', 'pjp', 'avif',
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt',
        'webm', 'mp3', 'wav', 'ogg', 'mp4', 'mov'
    ];

    if (!allowedExts.includes(ext)) {
        return cb(new Error(`File extension .${ext} is not allowed.`));
    }

    const isImage = file.mimetype.startsWith('image/') && !file.mimetype.includes('svg');
    const isDoc = file.mimetype.includes('pdf') || 
                  file.mimetype.includes('document') || 
                  file.mimetype.includes('msword') || 
                  file.mimetype.includes('wordprocessingml') ||
                  file.mimetype.includes('sheet') ||
                  file.mimetype.includes('excel') ||
                  file.mimetype.includes('presentation') ||
                  file.mimetype.includes('text/');
    const isMedia = file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/');

    if (!isImage && !isDoc && !isMedia) {
        return cb(new Error(`MIME type ${file.mimetype} is not permitted.`));
    }

    return cb(null, true);
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
    fileFilter: fileFilter
});

upload.fileFilter = fileFilter;
upload.publicDir = publicUploadsDir;
upload.privateDir = privateUploadsDir;

module.exports = upload;
