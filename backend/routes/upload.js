const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const upload = require('../middleware/uploadMiddleware');
const { auth } = require('../middleware/authMiddleware');

router.post('/', auth, (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            console.error('[Upload Middleware Error]:', err.message);
            return res.status(400).json({ error: err.message || 'File upload failed' });
        }
        uploadController.uploadFile(req, res);
    });
});

// Protected route for private documents (KYC, payment proofs)
router.get('/secure/:filename', auth, uploadController.getSecureFile);

module.exports = router;

