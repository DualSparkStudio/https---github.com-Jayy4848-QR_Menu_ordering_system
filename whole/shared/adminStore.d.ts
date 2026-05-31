export interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: string;
    restaurantId: string;
}
export interface AuthState {
    user: AdminUser | null;
    token: string | null;
    refreshToken: string | null;
    isLoggedIn: boolean;
    loading: boolean;
    error: string | null;
}
interface StaffLoginResponse {
    staff: AdminUser;
    accessToken: string;
    refreshToken: string;
}
interface AdminApiLike {
    staffLogin: (email: string, password: string) => Promise<StaffLoginResponse>;
}
export declare function createAdminStore(adminApi: AdminApiLike): any;
export {};
//# sourceMappingURL=adminStore.d.ts.map