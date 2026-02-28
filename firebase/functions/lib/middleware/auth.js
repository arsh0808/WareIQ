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
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAccess = exports.requirePermission = exports.permissions = exports.requireWarehouseAccess = exports.requireMinRole = exports.requireRole = exports.verifyAuth = void 0;
const admin = __importStar(require("firebase-admin"));
/**
 * Middleware to verify Firebase authentication token
 */
const verifyAuth = async (req, res, next) => {
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
                req.userRole = userDoc.data();
            }
            next();
        }
        catch (error) {
            console.error('Token verification error:', error);
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid or expired token',
            });
            return;
        }
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Authentication failed',
        });
    }
};
exports.verifyAuth = verifyAuth;
/**
 * Middleware to check if user has required role(s)
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
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
exports.requireRole = requireRole;
/**
 * Role hierarchy for permission checking
 */
const roleHierarchy = {
    admin: 4,
    manager: 3,
    staff: 2,
    viewer: 1,
};
/**
 * Check if user has minimum required role level
 */
const requireMinRole = (minRole) => {
    return (req, res, next) => {
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
exports.requireMinRole = requireMinRole;
/**
 * Check if user can access warehouse data
 */
const requireWarehouseAccess = (req, res, next) => {
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
exports.requireWarehouseAccess = requireWarehouseAccess;
/**
 * Permission definitions
 */
exports.permissions = {
    canManageUsers: ['admin', 'manager'],
    canManageWarehouses: ['admin'],
    canViewAnalytics: ['admin', 'manager'],
    canEditInventory: ['admin', 'manager', 'staff'],
    canDeleteInventory: ['admin', 'manager'],
    canManageDevices: ['admin', 'manager'],
    canViewAuditLogs: ['admin', 'manager'],
    canManageSuppliers: ['admin', 'manager'],
    canExportData: ['admin', 'manager'],
    canImportData: ['admin', 'manager'],
    canManageSettings: ['admin', 'manager'],
};
/**
 * Check specific permission
 */
const requirePermission = (permission) => {
    return (0, exports.requireRole)(exports.permissions[permission]);
};
exports.requirePermission = requirePermission;
/**
 * Log access attempts for audit
 */
const logAccess = async (req, action, resource, success, metadata) => {
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
    }
    catch (error) {
        console.error('Error logging access:', error);
    }
};
exports.logAccess = logAccess;
//# sourceMappingURL=auth.js.map