import { Request, Response, NextFunction } from 'express';
export declare class QueueController {
    createQueue(req: Request, res: Response, next: NextFunction): Promise<void>;
    listQueues(req: Request, res: Response, next: NextFunction): Promise<void>;
    getQueueById(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    updateQueue(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteQueue(req: Request, res: Response, next: NextFunction): Promise<void>;
    pauseQueue(req: Request, res: Response, next: NextFunction): Promise<void>;
    resumeQueue(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const queueController: QueueController;
//# sourceMappingURL=queue.controller.d.ts.map