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

    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host');

    const fileUrl = isPrivate 
        ? `${proto}://${host}/api/upload/secure/${req.file.filename}`
        : `${proto}://${host}/uploads/${req.file.filename}`;

    res.json({
        message: 'File uploaded successfully',
        filename: req.file.filename,
        isPrivate,
        url: fileUrl
    });
};

exports.getSecureFile = (req, res) => {
    const { filename } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Security check: prevent path traversal attacks
    const safeFilename = path.basename(filename);
    const filePath = path.join(upload.privateDir, safeFilename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Requested document not found' });
    }

    // Authorization & Ownership check:
    if (userRole !== 'admin') {
        if (safeFilename.startsWith('sec_')) {
            const parts = safeFilename.split('_');
            const ownerId = parts[1];
            if (ownerId !== userId) {
                return res.status(403).json({ error: 'Access denied: You do not have permission to view this file' });
            }
        } else {
            return res.status(403).json({ error: 'Access denied: You do not have permission to view this private document' });
        }
    }

    res.sendFile(filePath);
};
