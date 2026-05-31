"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminApi = createAdminApi;
async function req(baseUrl, url, options, token) {
    const res = await fetch(`${baseUrl}${url}`, {
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options?.headers,
        },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Request failed: ${res.status}`);
    }
    return res.json();
}
function getRevenueQuery(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate)
        params.set("startDate", startDate);
    if (endDate)
        params.set("endDate", endDate);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
}
function createAdminApi(baseUrl) {
    const request = (url, options, token) => req(baseUrl, url, options, token);
    const staffLogin = (email, password) => request("/auth/staff/login", { method: "POST", body: JSON.stringify({ email, password }) });
    return {
        // Auth
        staffLogin,
        login: staffLogin,
        // Restaurant
        getRestaurant: (id, token) => request(`/restaurants/${id}`, {}, token),
        updateRestaurant: (id, data, token) => request(`/restaurants/${id}`, { method: "PUT", body: JSON.stringify(data) }, token),
        // Dashboard
        getDashboard: (restaurantId, token) => request(`/admin/restaurants/${restaurantId}/dashboard`, {}, token),
        getRevenue: (restaurantId, token, startDate, endDate) => request(`/admin/restaurants/${restaurantId}/revenue${getRevenueQuery(startDate, endDate)}`, {}, token),
        // Tables
        getTables: (restaurantId, token) => request(`/restaurants/${restaurantId}/tables`, {}, token),
        createTable: (restaurantId, data, token) => request(`/restaurants/${restaurantId}/tables`, { method: "POST", body: JSON.stringify(data) }, token),
        updateTable: (restaurantId, id, data, token) => request(`/restaurants/${restaurantId}/tables/${id}`, { method: "PUT", body: JSON.stringify(data) }, token),
        updateTableStatus: (restaurantId, id, status, token) => request(`/restaurants/${restaurantId}/tables/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }, token),
        deleteTable: (restaurantId, id, token) => request(`/restaurants/${restaurantId}/tables/${id}`, { method: "DELETE" }, token),
        regenerateQR: (restaurantId, id, token) => request(`/restaurants/${restaurantId}/tables/${id}/regenerate-qr`, { method: "PUT" }, token),
        // Menu
        getCategories: (restaurantId, token) => request(`/restaurants/${restaurantId}/menu/categories/admin`, {}, token),
        createCategory: (restaurantId, data, token) => request(`/restaurants/${restaurantId}/menu/categories`, { method: "POST", body: JSON.stringify(data) }, token),
        updateCategory: (restaurantId, id, data, token) => request(`/restaurants/${restaurantId}/menu/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }, token),
        deleteCategory: (restaurantId, id, token) => request(`/restaurants/${restaurantId}/menu/categories/${id}`, { method: "DELETE" }, token),
        createMenuItem: (restaurantId, data, token) => request(`/restaurants/${restaurantId}/menu/items`, { method: "POST", body: JSON.stringify(data) }, token),
        updateMenuItem: (restaurantId, id, data, token) => request(`/restaurants/${restaurantId}/menu/items/${id}`, { method: "PUT", body: JSON.stringify(data) }, token),
        toggleItemAvailability: (restaurantId, id, token) => request(`/restaurants/${restaurantId}/menu/items/${id}/toggle-availability`, { method: "PUT" }, token),
        deleteMenuItem: (restaurantId, id, token) => request(`/restaurants/${restaurantId}/menu/items/${id}`, { method: "DELETE" }, token),
        // Orders
        getOrders: (restaurantId, token, filters) => {
            const params = new URLSearchParams(filters || {});
            const query = params.toString();
            return request(`/restaurants/${restaurantId}/orders${query ? `?${query}` : ""}`, {}, token);
        },
        getOrder: (id, token) => request(`/orders/${id}`, {}, token),
        updateOrderStatus: (id, status, token) => request(`/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }, token),
        markAsPaid: (id, token) => request(`/orders/${id}/mark-paid`, { method: "PUT" }, token),
        updateItemStatus: (itemId, status, token) => request(`/order-items/${itemId}/status`, { method: "PUT", body: JSON.stringify({ status }) }, token),
        // Waiter calls
        getWaiterCalls: (restaurantId, token, status) => request(`/restaurants/${restaurantId}/waiter-calls${status ? `?status=${status}` : ""}`, {}, token),
        updateWaiterCall: (id, data, token) => request(`/waiter-calls/${id}`, { method: "PUT", body: JSON.stringify(data) }, token),
        // Staff
        getStaff: (restaurantId, token) => request(`/admin/restaurants/${restaurantId}/staff`, {}, token),
        createStaff: (restaurantId, data, token) => request(`/admin/restaurants/${restaurantId}/staff`, { method: "POST", body: JSON.stringify(data) }, token),
        updateStaff: (restaurantId, id, data, token) => request(`/admin/restaurants/${restaurantId}/staff/${id}`, { method: "PUT", body: JSON.stringify(data) }, token),
        deleteStaff: (restaurantId, id, token) => request(`/admin/restaurants/${restaurantId}/staff/${id}`, { method: "DELETE" }, token),
        // Coupons
        getCoupons: (restaurantId, token) => request(`/restaurants/${restaurantId}/coupons`, {}, token),
        createCoupon: (restaurantId, data, token) => request(`/restaurants/${restaurantId}/coupons`, { method: "POST", body: JSON.stringify(data) }, token),
        toggleCoupon: (restaurantId, id, token) => request(`/restaurants/${restaurantId}/coupons/${id}/toggle`, { method: "PUT" }, token),
        deleteCoupon: (restaurantId, id, token) => request(`/restaurants/${restaurantId}/coupons/${id}`, { method: "DELETE" }, token),
        // Reviews
        getReviews: (restaurantId, token) => request(`/restaurants/${restaurantId}/reviews`, {}, token),
        getReviewStats: (restaurantId, token) => request(`/restaurants/${restaurantId}/reviews/stats`, {}, token),
        // Reports
        getSalesReport: (restaurantId, token, startDate, endDate) => request(`/restaurants/${restaurantId}/reports/sales?startDate=${startDate}&endDate=${endDate}`, {}, token),
    };
}
//# sourceMappingURL=adminApi.js.map