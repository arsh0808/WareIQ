import * as admin from 'firebase-admin';
import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: admin.auth.DecodedIdToken;
  userRole?: UserRole;
}

export interface UserRole {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'staff' | 'viewer';
  warehouseId: string;
  photoURL?: string;
  createdAt: Date;
  lastLogin: Date;
}

/**
 * Middleware to verify Firebase authentication token
 */
export const verifyAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided',
      });
      return;
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;

      // Fetch user role from Firestore
      const userDoc = await admin
        .firestore()
        .collection('users')
        .doc(decodedToken.uid)
        .get();

      if (userDoc.exists) {
        req.userRole = userDoc.data() as UserRole;
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
      return;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
};

/**
 * Middleware to check if user has required role(s)
 */
export const requireRole = (allowedRoles: UserRole['role'][]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User role not found',
      });
      return;
    }

    if (!allowedRoles.includes(req.userRole.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        userRole: req.userRole.role,
      });
      return;
    }

    next();
  };
};

/**
 * Role hierarchy for permission checking
 */
const roleHierarchy: Record<UserRole['role'], number> = {
  admin: 4,
  manager: 3,
  staff: 2,
  viewer: 1,
};

/**
 * Check if user has minimum required role level
 */
export const requireMinRole = (minRole: UserRole['role']) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User role not found',
      });
      return;
    }

    const userLevel = roleHierarchy[req.userRole.role];
    const requiredLevel = roleHierarchy[minRole];

    if (userLevel < requiredLevel) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Insufficient permissions. Required role: ${minRole} or higher`,
        userRole: req.userRole.role,
      });
      return;
    }

    next();
  };
};

/**
 * Check if user can access warehouse data
 */
export const requireWarehouseAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.userRole) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'User role not found',
    });
  }

  const requestedWarehouseId = req.params.warehouseId || req.body.warehouseId;

  // Admins can access all warehouses
  if (req.userRole.role === 'admin') {
    return next();
  }

  // Other users can only access their assigned warehouse
  if (req.userRole.warehouseId !== requestedWarehouseId) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have access to this warehouse',
      assignedWarehouse: req.userRole.warehouseId,
      requestedWarehouse: requestedWarehouseId,
    });
  }

  next();
};

/**
 * Permission definitions
 */
export const permissions = {
  canManageUsers: ['admin', 'manager'] as UserRole['role'][],
  canManageWarehouses: ['admin'] as UserRole['role'][],
  canViewAnalytics: ['admin', 'manager'] as UserRole['role'][],
  canEditInventory: ['admin', 'manager', 'staff'] as UserRole['role'][],
  canDeleteInventory: ['admin', 'manager'] as UserRole['role'][],
  canManageDevices: ['admin', 'manager'] as UserRole['role'][],
  canViewAuditLogs: ['admin', 'manager'] as UserRole['role'][],
  canManageSuppliers: ['admin', 'manager'] as UserRole['role'][],
  canExportData: ['admin', 'manager'] as UserRole['role'][],
  canImportData: ['admin', 'manager'] as UserRole['role'][],
  canManageSettings: ['admin', 'manager'] as UserRole['role'][],
};

/**
 * Check specific permission
 */
export const requirePermission = (permission: keyof typeof permissions) => {
  return requireRole(permissions[permission]);
};

/**
 * Log access attempts for audit
 */
export const logAccess = async (
  req: AuthRequest,
  action: string,
  resource: string,
  success: boolean,
  metadata?: any
) => {
  try {
    await admin.firestore().collection('audit-logs').add({
      userId: req.user?.uid || 'unknown',
      userEmail: req.user?.email || 'unknown',
      userRole: req.userRole?.role || 'unknown',
      action,
      resource,
      success,
      metadata: metadata || {},
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  } catch (error) {
    console.error('Error logging access:', error);
  }
};
