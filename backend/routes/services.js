const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/authMiddleware');
const serviceCtrl = require('../controllers/serviceController');
const adminServiceCtrl = require('../controllers/adminServiceController');
const customProjectCtrl = require('../controllers/customProjectController');

// ==========================================
// 1. PUBLIC / BROWSING ENDPOINTS
// ==========================================
router.get('/categories', serviceCtrl.getCategories);
router.get('/products', serviceCtrl.getProducts);
router.get('/products/:slug', serviceCtrl.getProductBySlug);
router.get('/settings', serviceCtrl.getPublicSettings);

// ==========================================
// 2. AUTHENTICATED USER / STUDENT ENDPOINTS
// ==========================================
// Orders & Payment
router.post('/orders/wallet', auth, serviceCtrl.createWalletOrder);
router.post('/orders/paypal-create', auth, serviceCtrl.createPayPalOrder);
router.post('/orders/paypal-capture', auth, serviceCtrl.capturePayPalOrder);
router.get('/my-orders', auth, serviceCtrl.getMyOrders);
router.get('/my-orders/:id', auth, serviceCtrl.getMyOrderById);

// Custom Projects
router.post('/custom-projects', auth, customProjectCtrl.createRequest);
router.get('/custom-projects', auth, customProjectCtrl.getMyRequests);
router.get('/custom-projects/:id', auth, customProjectCtrl.getMyRequestById);

// ==========================================
// 3. ADMIN MANAGEMENT ENDPOINTS
// ==========================================
// Categories
router.get('/admin/categories', auth, authorize('admin'), adminServiceCtrl.adminGetCategories);
router.post('/admin/categories', auth, authorize('admin'), adminServiceCtrl.adminCreateCategory);
router.put('/admin/categories/:id', auth, authorize('admin'), adminServiceCtrl.adminUpdateCategory);
router.delete('/admin/categories/:id', auth, authorize('admin'), adminServiceCtrl.adminDeleteCategory);

// Products & Offers
router.get('/admin/products', auth, authorize('admin'), adminServiceCtrl.adminGetProducts);
router.post('/admin/products', auth, authorize('admin'), adminServiceCtrl.adminCreateProduct);
router.put('/admin/products/:id', auth, authorize('admin'), adminServiceCtrl.adminUpdateProduct);
router.delete('/admin/products/:id', auth, authorize('admin'), adminServiceCtrl.adminDeleteProduct);

// Orders & Manual Delivery
router.get('/admin/orders', auth, authorize('admin'), adminServiceCtrl.adminGetOrders);
router.get('/admin/orders/:id', auth, authorize('admin'), adminServiceCtrl.adminGetOrderById);
router.put('/admin/orders/:id/deliver', auth, authorize('admin'), adminServiceCtrl.adminDeliverOrder);
router.put('/admin/orders/:id/status', auth, authorize('admin'), adminServiceCtrl.adminUpdateOrderStatus);
router.delete('/admin/orders/:id', auth, authorize('admin'), adminServiceCtrl.adminDeleteOrder);
router.get('/admin/stats', auth, authorize('admin'), adminServiceCtrl.adminGetStats);

// Custom Projects Management
router.get('/admin/custom-projects', auth, authorize('admin'), customProjectCtrl.adminGetRequests);
router.get('/admin/custom-projects/:id', auth, authorize('admin'), customProjectCtrl.adminGetRequestById);
router.put('/admin/custom-projects/:id', auth, authorize('admin'), customProjectCtrl.adminUpdateRequest);

module.exports = router;
