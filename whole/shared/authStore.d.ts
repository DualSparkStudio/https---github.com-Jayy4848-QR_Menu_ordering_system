export interface StaffUser {
    id: string;
    email: string;
    name: string;
    role: string;
    restaurantId: string;
}
interface StaffLoginResponse {
    staff: StaffUser;
    accessToken: string;
}
interface AdminApiLike {
    staffLogin: (email: string, password: string) => Promise<StaffLoginResponse>;
}
export interface AuthStoreState {
    staff: StaffUser | null;
    token: string | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}
export declare function createAuthStore(adminApi: AdminApiLike): any;
export {};
//# sourceMappingURL=authStore.d.ts.map