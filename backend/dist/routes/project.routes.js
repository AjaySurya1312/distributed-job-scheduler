"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const prisma_1 = require("../config/prisma");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/', async (req, res, next) => {
    try {
        const { name, organizationId } = req.body;
        const project = await prisma_1.prisma.project.create({ data: { name, organizationId } });
        res.status(201).json(project);
    }
    catch (error) {
        next(error);
    }
});
router.get('/', async (req, res, next) => {
    try {
        const projects = await prisma_1.prisma.project.findMany();
        res.json(projects);
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const project = await prisma_1.prisma.project.findUnique({ where: { id: req.params.id } });
        if (!project)
            return res.status(404).json({ error: 'Not found' });
        res.json(project);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=project.routes.js.map