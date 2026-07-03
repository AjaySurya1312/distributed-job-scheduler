"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const prisma_1 = require("../config/prisma");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/', async (req, res, next) => {
    try {
        const { name } = req.body;
        const org = await prisma_1.prisma.organization.create({ data: { name } });
        res.status(201).json(org);
    }
    catch (error) {
        next(error);
    }
});
router.get('/', async (req, res, next) => {
    try {
        const orgs = await prisma_1.prisma.organization.findMany();
        res.json(orgs);
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/members', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { userId, role } = req.body;
        const member = await prisma_1.prisma.organizationMember.create({
            data: { organizationId: id, userId, role }
        });
        res.status(201).json(member);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=organization.routes.js.map