"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post('/register', auth_controller_1.authController.register);
router.post('/login', auth_controller_1.authController.login);
router.post('/refresh', auth_controller_1.authController.refreshToken);
router.post('/logout', auth_controller_1.authController.logout);
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.authController.me);
router.post('/api-keys', auth_middleware_1.authenticate, auth_controller_1.authController.createApiKey);
router.delete('/api-keys/:id', auth_middleware_1.authenticate, auth_controller_1.authController.revokeApiKey);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map