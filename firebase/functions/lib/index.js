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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
admin.initializeApp();
__exportStar(require("./triggers/onInventoryUpdate"), exports);
__exportStar(require("./triggers/onDeviceDataReceived"), exports);
__exportStar(require("./triggers/onAlertCreated"), exports);
__exportStar(require("./triggers/onRoleChange"), exports);
__exportStar(require("./triggers/onLowStock"), exports);
__exportStar(require("./scheduled/dailyReports"), exports);
__exportStar(require("./scheduled/deviceHealthCheck"), exports);
__exportStar(require("./api/iotWebhook"), exports);
__exportStar(require("./api/analytics"), exports);
// Import role management router
const roleManagement_1 = require("./api/roleManagement");
// Create Express app for API
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
// Mount role management routes
app.use("/roles", roleManagement_1.roleManagementRouter);
// Export as Cloud Function
exports.api = functions.https.onRequest(app);
exports.healthCheck = functions.https.onRequest((request, response) => {
    response.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.1.0",
    });
});
//# sourceMappingURL=index.js.map