"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
class AuthController {
    async register(req, res, next) {
        try {
            const result = await auth_service_1.authService.register(req.body);
            res.status(201).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const result = await auth_service_1.authService.login(req.body);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const result = await auth_service_1.authService.refreshToken(refreshToken);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            const { refreshToken } = req.body;
            await auth_service_1.authService.logout(refreshToken);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    async me(req, res, next) {
        try {
            const userId = req.user?.id;
            const user = await auth_service_1.authService.me(userId);
            res.json(user);
        }
        catch (error) {
            next(error);
        }
    }
    async createApiKey(req, res, next) {
        try {
            const userId = req.user?.id;
            const { projectId, name } = req.body;
            const apiKey = await auth_service_1.authService.createApiKey(userId, projectId, name);
            res.status(201).json(apiKey);
        }
        catch (error) {
            next(error);
        }
    }
    async revokeApiKey(req, res, next) {
        try {
            const { id } = req.params;
            await auth_service_1.authService.revokeApiKey(id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map