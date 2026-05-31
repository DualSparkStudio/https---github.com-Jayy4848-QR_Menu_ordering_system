"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminStore = createAdminStore;
const zustand_1 = require("zustand");
function createAdminStore(adminApi) {
    return (0, zustand_1.create)((set) => ({
        user: null,
        token: null,
        refreshToken: null,
        isLoggedIn: false,
        loading: false,
        error: null,
        login: async (email, password) => {
            set({ loading: true, error: null });
            try {
                const response = await adminApi.staffLogin(email, password);
                set({
                    user: response.staff,
                    token: response.accessToken,
                    refreshToken: response.refreshToken,
                    isLoggedIn: true,
                    loading: false,
                });
                if (typeof window !== "undefined") {
                    localStorage.setItem("adminToken", response.accessToken);
                    localStorage.setItem("adminRefreshToken", response.refreshToken);
                    localStorage.setItem("adminUser", JSON.stringify(response.staff));
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Login failed";
                set({ loading: false, error: errorMessage, isLoggedIn: false });
                throw error;
            }
        },
        logout: () => {
            set({
                user: null,
                token: null,
                refreshToken: null,
                isLoggedIn: false,
            });
            if (typeof window !== "undefined") {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("adminRefreshToken");
                localStorage.removeItem("adminUser");
            }
        },
        setError: (error) => set({ error }),
        setLoading: (loading) => set({ loading }),
    }));
}
//# sourceMappingURL=adminStore.js.map