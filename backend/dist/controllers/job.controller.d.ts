import { Request, Response, NextFunction } from 'express';
export declare class JobController {
    createJob(req: Request, res: Response, next: NextFunction): Promise<void>;
    listJobs(req: Request, res: Response, next: NextFunction): Promise<void>;
    getJobById(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    cancelJob(req: Request, res: Response, next: NextFunction): Promise<void>;
    retryJob(req: Request, res: Response, next: NextFunction): Promise<void>;
    getJobLogs(req: Request, res: Response, next: NextFunction): Promise<void>;
    getJobStats(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const jobController: JobController;
//# sourceMappingURL=job.controller.d.ts.map