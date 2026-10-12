const path = require('path');
const fs = require('fs');
const upload = require('../middleware/uploadMiddleware');

exports.uploadFile = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Please upload a file' });
    }

    const isPrivate = req.query.private === 'true' || 
                      req.baseUrl?.includes('kyc') || 
                      req.path?.includes('private') || 
                      req.path?.includes('secure');

    const fileUrl = isPrivate 
        ? `${req.protocol}://${req.get('host')}/api/upload/secure/${req.file.filename}`
        : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    res.json({
        message: 'File uploaded successfully',
        filename: req.file.filename,
        isPrivate,
        url: fileUrl
    });
};

exports.getSecureFile = (req, res) => {
    const { filename } = req.params;
    // Security check: prevent path traversal attacks
    const safeFilename = path.basename(filename);
    const filePath = path.join(upload.privateDir, safeFilename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Requested document not found' });
    }

    res.sendFile(filePath);
};
