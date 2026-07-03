import { Request, Response, NextFunction } from 'express';
export declare class DashboardController {
    getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getWorkersStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    getQueueMetrics(req: Request, res: Response, next: NextFunction): Promise<void>;
    getThroughput(req: Request, res: Response, next: NextFunction): Promise<void>;
    getHealth(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const dashboardController: DashboardController;
//# sourceMappingURL=dashboard.controller.d.ts.map