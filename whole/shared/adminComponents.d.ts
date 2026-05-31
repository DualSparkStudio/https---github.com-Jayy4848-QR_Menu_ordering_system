type AuthHook = () => {
    staff: {
        role?: string;
        name?: string;
        email?: string;
    } | null;
    logout: () => void;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    loading: boolean;
    error: string | null;
};
export declare function createAdminLayout(useAuthStore: AuthHook): ({ children }: {
    children: React.ReactNode;
}) => any;
export declare function createLoginPage(useAuthStore: AuthHook): () => any;
export {};
//# sourceMappingURL=adminComponents.d.ts.map