const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const { auth } = require('../middleware/authMiddleware');

// All community routes require authentication
router.use(auth);

router.get('/posts', communityController.getPosts);
router.post('/posts', communityController.createPost);
router.get('/posts/:id/comments', communityController.getComments);
router.post('/posts/:id/comments', communityController.addComment);
router.post('/posts/:id/like', communityController.toggleLike);
router.delete('/posts/:id', communityController.deletePost);

module.exports = router;
