const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/authMiddleware');
const supportController = require('../controllers/supportController');

// All support routes require authentication
router.use(auth);

// ─── AI Assistant (Accessible to all authenticated members) ───
router.post('/ai-chat', supportController.aiChat);

// ─── Member Ticket Routes ──────────────────────────────────
router.get('/tickets', supportController.getUserTickets);
router.post('/tickets', supportController.createTicket);
router.get('/tickets/:id', supportController.getTicketDetails);
router.post('/tickets/:id/messages', supportController.addMessage);
router.put('/tickets/:id/close', supportController.closeTicket);

// ─── Admin Ticket Routes (Admin only) ──────────────────────
router.get('/admin/tickets', authorize('admin'), supportController.adminGetTickets);
router.get('/admin/stats', authorize('admin'), supportController.adminGetStats);
router.put('/admin/tickets/:id/status', authorize('admin'), supportController.adminUpdateStatus);
router.put('/admin/tickets/:id/priority', authorize('admin'), supportController.adminUpdatePriority);

module.exports = router;
