const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { auth } = require('../middleware/authMiddleware');

router.use(auth);

// Contacts & Users for Chat
router.get('/contacts', chatController.getContacts);

// Conversations
router.get('/conversations', chatController.getConversations);
router.post('/conversations/direct', chatController.getOrCreateDirectConversation);
router.post('/conversations/cohort', chatController.getOrCreateCohortConversation);

// Messages
router.get('/conversations/:id/messages', chatController.getMessages);
router.post('/conversations/:id/messages', chatController.sendMessage);
router.post('/conversations/:id/read', chatController.markAsRead);

// Reactions
router.post('/messages/:messageId/reactions', chatController.toggleReaction);

// Typing
router.post('/conversations/:id/typing', chatController.setTyping);
router.get('/conversations/:id/typing', chatController.getTyping);

module.exports = router;
