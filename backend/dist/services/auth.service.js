"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const prisma_1 = require("../config/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7 days
class AuthService {
    async register(data) {
        const existingUser = await prisma_1.prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) {
            throw new Error('User already exists');
        }
        const hashedPassword = await bcrypt_1.default.hash(data.password, 10);
        const user = await prisma_1.prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
            }
        });
        const token = this.generateToken(user.id);
        return { user, token };
    }
    async login(data) {
        const user = await prisma_1.prisma.user.findUnique({ where: { email: data.email } });
        if (!user || !user.password) {
            throw new Error('Invalid credentials');
        }
        const isMatch = await bcrypt_1.default.compare(data.password, user.password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }
        const token = this.generateToken(user.id);
        const refreshToken = await this.createRefreshToken(user.id);
        return { user, token, refreshToken: refreshToken.token };
    }
    async refreshToken(tokenStr) {
        const refreshToken = await prisma_1.prisma.refreshToken.findUnique({ where: { token: tokenStr }, include: { user: true } });
        if (!refreshToken || refreshToken.expiresAt < new Date()) {
            throw new Error('Invalid or expired refresh token');
        }
        const newToken = this.generateToken(refreshToken.userId);
        const newRefreshToken = await this.createRefreshToken(refreshToken.userId);
        await prisma_1.prisma.refreshToken.delete({ where: { id: refreshToken.id } });
        return { token: newToken, refreshToken: newRefreshToken.token };
    }
    async logout(tokenStr) {
        await prisma_1.prisma.refreshToken.deleteMany({ where: { token: tokenStr } });
    }
    async me(userId) {
        return prisma_1.prisma.user.findUnique({ where: { id: userId } });
    }
    async createApiKey(userId, projectId, name) {
        const key = crypto_1.default.randomBytes(32).toString('hex');
        return prisma_1.prisma.apiKey.create({
            data: {
                key,
                name,
                userId,
                projectId
            }
        });
    }
    async revokeApiKey(id) {
        await prisma_1.prisma.apiKey.delete({ where: { id } });
    }
    generateToken(userId) {
        return jsonwebtoken_1.default.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    }
    async createRefreshToken(userId) {
        const token = crypto_1.default.randomBytes(40).toString('hex');
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN);
        return prisma_1.prisma.refreshToken.create({
            data: {
                token,
                userId,
                expiresAt
            }
        });
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map