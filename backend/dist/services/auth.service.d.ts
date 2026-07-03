import { User, ApiKey } from '@prisma/client';
export declare class AuthService {
    register(data: any): Promise<{
        user: User;
        token: string;
    }>;
    login(data: any): Promise<{
        user: User;
        token: string;
        refreshToken: string;
    }>;
    refreshToken(tokenStr: string): Promise<{
        token: string;
        refreshToken: string;
    }>;
    logout(tokenStr: string): Promise<void>;
    me(userId: string): Promise<User | null>;
    createApiKey(userId: string, projectId: string, name: string): Promise<ApiKey>;
    revokeApiKey(id: string): Promise<void>;
    private generateToken;
    private createRefreshToken;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map