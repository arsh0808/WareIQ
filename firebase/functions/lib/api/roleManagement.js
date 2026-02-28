"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleManagementRouter = void 0;
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Apply auth middleware to all routes
router.use(auth_1.verifyAuth);
/**
 * Get all users with their roles (Admin/Manager only)
 */
router.get('/users', (0, auth_1.requirePermission)('canManageUsers'), async (req, res) => {
    try {
        const usersSnapshot = await admin.firestore().collection('users').get();
        const users = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        await (0, auth_1.logAccess)(req, 'LIST_USERS', 'users', true, { count: users.length });
        res.json({
            success: true,
            users,
            count: users.length,
        });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        await (0, auth_1.logAccess)(req, 'LIST_USERS', 'users', false, { error: error.message });
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch users',
        });
    }
});
/**
 * Get user by ID with role information
 */
router.get('/users/:userId', (0, auth_1.requirePermission)('canManageUsers'), async (req, res) => {
    try {
        const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        if (!userDoc.exists) {
            await (0, auth_1.logAccess)(req, 'GET_USER', `users/${userId}`, false, { reason: 'not_found' });
            res.status(404).json({
                error: 'Not Found',
                message: 'User not found',
            });
            return;
        }
        await (0, auth_1.logAccess)(req, 'GET_USER', `users/${userId}`, true);
        res.json({
            success: true,
            user: {
                id: userDoc.id,
                ...userDoc.data(),
            },
        });
    }
    catch (error) {
        console.error('Error fetching user:', error);
        await (0, auth_1.logAccess)(req, 'GET_USER', `users/${req.params.userId}`, false, { error: error.message });
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch user',
        });
    }
});
/**
 * Update user role (Admin only)
 */
router.put('/users/:userId/role', (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
        const { role, reason } = req.body;
        // Validate role
        const validRoles = ['admin', 'manager', 'staff', 'viewer'];
        if (!role || !validRoles.includes(role)) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid role. Must be one of: admin, manager, staff, viewer',
            });
            return;
        }
        // Get current user data
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        if (!userDoc.exists) {
            await (0, auth_1.logAccess)(req, 'UPDATE_ROLE', `users/${userId}`, false, { reason: 'not_found' });
            res.status(404).json({
                error: 'Not Found',
                message: 'User not found',
            });
            return;
        }
        const currentData = userDoc.data();
        const oldRole = currentData?.role;
        // Prevent self-demotion from admin
        if (userId === req.user?.uid && oldRole === 'admin' && role !== 'admin') {
            res.status(403).json({
                error: 'Forbidden',
                message: 'You cannot change your own admin role',
            });
            return;
        }
        // Update role
        await admin.firestore().collection('users').doc(userId).update({
            role,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastRoleChange: {
                from: oldRole,
                to: role,
                changedBy: req.user?.uid,
                changedAt: admin.firestore.FieldValue.serverTimestamp(),
                reason: reason || 'No reason provided',
            },
        });
        // Log role change
        await admin.firestore().collection('role-changes').add({
            userId,
            userEmail: currentData?.email,
            oldRole,
            newRole: role,
            changedBy: req.user?.uid,
            changedByEmail: req.user?.email,
            reason: reason || 'No reason provided',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        await (0, auth_1.logAccess)(req, 'UPDATE_ROLE', `users/${userId}`, true, {
            oldRole,
            newRole: role,
            reason,
        });
        res.json({
            success: true,
            message: 'User role updated successfully',
            userId,
            oldRole,
            newRole: role,
        });
    }
    catch (error) {
        console.error('Error updating user role:', error);
        await (0, auth_1.logAccess)(req, 'UPDATE_ROLE', `users/${req.params.userId}`, false, { error: error.message });
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update user role',
        });
    }
});
/**
 * Update user warehouse assignment (Admin/Manager only)
 */
router.put('/users/:userId/warehouse', (0, auth_1.requirePermission)('canManageUsers'), async (req, res) => {
    try {
        const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
        const { warehouseId, reason } = req.body;
        if (!warehouseId) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'warehouseId is required',
            });
            return;
        }
        // Verify warehouse exists
        const warehouseDoc = await admin.firestore().collection('warehouses').doc(warehouseId).get();
        if (!warehouseDoc.exists) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Warehouse not found',
            });
            return;
        }
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        if (!userDoc.exists) {
            res.status(404).json({
                error: 'Not Found',
                message: 'User not found',
            });
            return;
        }
        const oldWarehouseId = userDoc.data()?.warehouseId;
        await admin.firestore().collection('users').doc(userId).update({
            warehouseId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastWarehouseChange: {
                from: oldWarehouseId,
                to: warehouseId,
                changedBy: req.user?.uid,
                changedAt: admin.firestore.FieldValue.serverTimestamp(),
                reason: reason || 'No reason provided',
            },
        });
        await (0, auth_1.logAccess)(req, 'UPDATE_WAREHOUSE', `users/${userId}`, true, {
            oldWarehouse: oldWarehouseId,
            newWarehouse: warehouseId,
            reason,
        });
        res.json({
            success: true,
            message: 'User warehouse updated successfully',
            userId,
            oldWarehouse: oldWarehouseId,
            newWarehouse: warehouseId,
        });
    }
    catch (error) {
        console.error('Error updating user warehouse:', error);
        await (0, auth_1.logAccess)(req, 'UPDATE_WAREHOUSE', `users/${req.params.userId}`, false, { error: error.message });
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update user warehouse',
        });
    }
});
/**
 * Get role change history
 */
router.get('/role-changes', (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const userId = req.query.userId;
        let query = admin
            .firestore()
            .collection('role-changes')
            .orderBy('timestamp', 'desc')
            .limit(limit);
        if (userId) {
            query = query.where('userId', '==', userId);
        }
        const snapshot = await query.get();
        const changes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        await (0, auth_1.logAccess)(req, 'LIST_ROLE_CHANGES', 'role-changes', true, { count: changes.length });
        res.json({
            success: true,
            changes,
            count: changes.length,
        });
    }
    catch (error) {
        console.error('Error fetching role changes:', error);
        await (0, auth_1.logAccess)(req, 'LIST_ROLE_CHANGES', 'role-changes', false, { error: error.message });
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch role changes',
        });
    }
});
/**
 * Deactivate user (Admin only)
 */
router.put('/users/:userId/deactivate', (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
        const { reason } = req.body;
        // Prevent self-deactivation
        if (userId === req.user?.uid) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'You cannot deactivate your own account',
            });
            return;
        }
        await admin.firestore().collection('users').doc(userId).update({
            active: false,
            deactivatedAt: admin.firestore.FieldValue.serverTimestamp(),
            deactivatedBy: req.user?.uid,
            deactivationReason: reason || 'No reason provided',
        });
        // Disable Firebase Auth account
        await admin.auth().updateUser(userId, { disabled: true });
        await (0, auth_1.logAccess)(req, 'DEACTIVATE_USER', `users/${userId}`, true, { reason });
        res.json({
            success: true,
            message: 'User deactivated successfully',
            userId,
        });
    }
    catch (error) {
        console.error('Error deactivating user:', error);
        await (0, auth_1.logAccess)(req, 'DEACTIVATE_USER', `users/${req.params.userId}`, false, { error: error.message });
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to deactivate user',
        });
    }
});
exports.roleManagementRouter = router;
//# sourceMappingURL=roleManagement.js.map