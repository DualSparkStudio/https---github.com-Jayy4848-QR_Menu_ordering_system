"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthStore = createAuthStore;
const zustand_1 = require("zustand");
const middleware_1 = require("zustand/middleware");
function createAuthStore(adminApi) {
    return (0, zustand_1.create)()((0, middleware_1.persist)((set) => ({
        staff: null,
        token: null,
        loading: false,
        error: null,
        isAuthenticated: false,
        login: async (email, password) => {
            set({ loading: true, error: null });
            try {
                const res = await adminApi.staffLogin(email, password);
                set({
                    staff: res.staff,
                    token: res.accessToken,
                    loading: false,
                    isAuthenticated: true,
                });
            }
            catch (e) {
                set({ error: e.message, loading: false, isAuthenticated: false });
                throw e;
            }
        },
        logout: () => set({ staff: null, token: null, isAuthenticated: false }),
    }), {
        name: "admin-auth",
        onRehydrateStorage: () => (state) => {
            if (state) {
                state.isAuthenticated = !!(state.token && state.staff);
            }
        },
    }));
}
//# sourceMappingURL=authStore.js.map