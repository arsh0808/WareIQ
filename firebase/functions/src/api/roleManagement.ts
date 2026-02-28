import * as admin from 'firebase-admin';
import express from 'express';
import { verifyAuth, requireRole, requirePermission, logAccess, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifyAuth as any);

/**
 * Get all users with their roles (Admin/Manager only)
 */
router.get('/users', requirePermission('canManageUsers') as any, async (req: AuthRequest, res) => {
  try {
    const usersSnapshot = await admin.firestore().collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    await logAccess(req, 'LIST_USERS', 'users', true, { count: users.length });

    res.json({
      success: true,
      users,
      count: users.length,
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    await logAccess(req, 'LIST_USERS', 'users', false, { error: error.message });
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch users',
    });
  }
});

/**
 * Get user by ID with role information
 */
router.get('/users/:userId', requirePermission('canManageUsers') as any, async (req: AuthRequest, res) => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

    const userDoc = await admin.firestore().collection('users').doc(userId).get();

    if (!userDoc.exists) {
      await logAccess(req, 'GET_USER', `users/${userId}`, false, { reason: 'not_found' });
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    await logAccess(req, 'GET_USER', `users/${userId}`, true);

    res.json({
      success: true,
      user: {
        id: userDoc.id,
        ...userDoc.data(),
      },
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    await logAccess(req, 'GET_USER', `users/${req.params.userId}`, false, { error: error.message });
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user',
    });
  }
});

/**
 * Update user role (Admin only)
 */
router.put('/users/:userId/role', requireRole(['admin']) as any, async (req: AuthRequest, res) => {
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
      await logAccess(req, 'UPDATE_ROLE', `users/${userId}`, false, { reason: 'not_found' });
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

    await logAccess(req, 'UPDATE_ROLE', `users/${userId}`, true, {
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
  } catch (error: any) {
    console.error('Error updating user role:', error);
    await logAccess(req, 'UPDATE_ROLE', `users/${req.params.userId}`, false, { error: error.message });
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user role',
    });
  }
});

/**
 * Update user warehouse assignment (Admin/Manager only)
 */
router.put('/users/:userId/warehouse', requirePermission('canManageUsers') as any, async (req: AuthRequest, res) => {
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

    await logAccess(req, 'UPDATE_WAREHOUSE', `users/${userId}`, true, {
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
  } catch (error: any) {
    console.error('Error updating user warehouse:', error);
    await logAccess(req, 'UPDATE_WAREHOUSE', `users/${req.params.userId}`, false, { error: error.message });
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user warehouse',
    });
  }
});

/**
 * Get role change history
 */
router.get('/role-changes', requireRole(['admin']) as any, async (req: AuthRequest, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const userId = req.query.userId as string;

    let query = admin
      .firestore()
      .collection('role-changes')
      .orderBy('timestamp', 'desc')
      .limit(limit);

    if (userId) {
      query = query.where('userId', '==', userId) as any;
    }

    const snapshot = await query.get();
    const changes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    await logAccess(req, 'LIST_ROLE_CHANGES', 'role-changes', true, { count: changes.length });

    res.json({
      success: true,
      changes,
      count: changes.length,
    });
  } catch (error: any) {
    console.error('Error fetching role changes:', error);
    await logAccess(req, 'LIST_ROLE_CHANGES', 'role-changes', false, { error: error.message });
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch role changes',
    });
  }
});

/**
 * Deactivate user (Admin only)
 */
router.put('/users/:userId/deactivate', requireRole(['admin']) as any, async (req: AuthRequest, res) => {
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

    await logAccess(req, 'DEACTIVATE_USER', `users/${userId}`, true, { reason });

    res.json({
      success: true,
      message: 'User deactivated successfully',
      userId,
    });
  } catch (error: any) {
    console.error('Error deactivating user:', error);
    await logAccess(req, 'DEACTIVATE_USER', `users/${req.params.userId}`, false, { error: error.message });
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to deactivate user',
    });
  }
});

export const roleManagementRouter = router;
