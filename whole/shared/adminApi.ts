type RequestOptions = RequestInit | undefined;

async function req<T>(baseUrl: string, url: string, options?: RequestOptions, token?: string): Promise<T> {
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

function getRevenueQuery(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function createAdminApi(baseUrl: string) {
  const request = <T>(url: string, options?: RequestOptions, token?: string) =>
    req<T>(baseUrl, url, options, token);

  const staffLogin = (email: string, password: string) =>
    request("/auth/staff/login", { method: "POST", body: JSON.stringify({ email, password }) });

  return {
    // Auth
    staffLogin,
    login: staffLogin,

    // Restaurant
    getRestaurant: (id: string, token: string) => request(`/restaurants/${id}`, {}, token),
    updateRestaurant: (id: string, data: any, token: string) =>
      request(`/restaurants/${id}`, { method: "PUT", body: JSON.stringify(data) }, token),

    // Dashboard
    getDashboard: (restaurantId: string, token: string) =>
      request(`/admin/restaurants/${restaurantId}/dashboard`, {}, token),
    getRevenue: (restaurantId: string, token: string, startDate?: string, endDate?: string) =>
      request(`/admin/restaurants/${restaurantId}/revenue${getRevenueQuery(startDate, endDate)}`, {}, token),

    // Tables
    getTables: (restaurantId: string, token: string) => request(`/restaurants/${restaurantId}/tables`, {}, token),
    createTable: (restaurantId: string, data: any, token: string) =>
      request(`/restaurants/${restaurantId}/tables`, { method: "POST", body: JSON.stringify(data) }, token),
    updateTable: (restaurantId: string, id: string, data: any, token: string) =>
      request(`/restaurants/${restaurantId}/tables/${id}`, { method: "PUT", body: JSON.stringify(data) }, token),
    updateTableStatus: (restaurantId: string, id: string, status: string, token: string) =>
      request(`/restaurants/${restaurantId}/tables/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }, token),
    deleteTable: (restaurantId: string, id: string, token: string) =>
      request(`/restaurants/${restaurantId}/tables/${id}`, { method: "DELETE" }, token),
    regenerateQR: (restaurantId: string, id: string, token: string) =>
      request(`/restaurants/${restaurantId}/tables/${id}/regenerate-qr`, { method: "PUT" }, token),

    // Menu
    getCategories: (restaurantId: string, token: string) =>
      request(`/restaurants/${restaurantId}/menu/categories/admin`, {}, token),
    createCategory: (restaurantId: string, data: any, token: string) =>
      request(`/restaurants/${restaurantId}/menu/categories`, { method: "POST", body: JSON.stringify(data) }, token),
    updateCategory: (restaurantId: string, id: string, data: any, token: string) =>
      request(`/restaurants/${restaurantId}/menu/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }, token),
    deleteCategory: (restaurantId: string, id: string, token: string) =>
      request(`/restaurants/${restaurantId}/menu/categories/${id}`, { method: "DELETE" }, token),
    createMenuItem: (restaurantId: string, data: any, token: string) =>
      request(`/restaurants/${restaurantId}/menu/items`, { method: "POST", body: JSON.stringify(data) }, token),
    updateMenuItem: (restaurantId: string, id: string, data: any, token: string) =>
      request(`/restaurants/${restaurantId}/menu/items/${id}`, { method: "PUT", body: JSON.stringify(data) }, token),
    toggleItemAvailability: (restaurantId: string, id: string, token: string) =>
      request(`/restaurants/${restaurantId}/menu/items/${id}/toggle-availability`, { method: "PUT" }, token),
    deleteMenuItem: (restaurantId: string, id: string, token: string) =>
      request(`/restaurants/${restaurantId}/menu/items/${id}`, { method: "DELETE" }, token),

    // Orders
    getOrders: (restaurantId: string, token: string, filters?: Record<string, string>) => {
      const params = new URLSearchParams(filters || {});
      const query = params.toString();
      return request(`/restaurants/${restaurantId}/orders${query ? `?${query}` : ""}`, {}, token);
    },
    getOrder: (id: string, token: string) => request(`/orders/${id}`, {}, token),
    updateOrderStatus: (id: string, status: string, token: string) =>
      request(`/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }, token),
    markAsPaid: (id: string, token: string) => request(`/orders/${id}/mark-paid`, { method: "PUT" }, token),
    updateItemStatus: (itemId: string, status: string, token: string) =>
      request(`/order-items/${itemId}/status`, { method: "PUT", body: JSON.stringify({ status }) }, token),

    // Waiter calls
    getWaiterCalls: (restaurantId: string, token: string, status?: string) =>
      request(`/restaurants/${restaurantId}/waiter-calls${status ? `?status=${status}` : ""}`, {}, token),
    updateWaiterCall: (id: string, data: any, token: string) =>
      request(`/waiter-calls/${id}`, { method: "PUT", body: JSON.stringify(data) }, token),

    // Staff
    getStaff: (restaurantId: string, token: string) => request(`/admin/restaurants/${restaurantId}/staff`, {}, token),
    createStaff: (restaurantId: string, data: any, token: string) =>
      request(`/admin/restaurants/${restaurantId}/staff`, { method: "POST", body: JSON.stringify(data) }, token),
    updateStaff: (restaurantId: string, id: string, data: any, token: string) =>
      request(`/admin/restaurants/${restaurantId}/staff/${id}`, { method: "PUT", body: JSON.stringify(data) }, token),
    deleteStaff: (restaurantId: string, id: string, token: string) =>
      request(`/admin/restaurants/${restaurantId}/staff/${id}`, { method: "DELETE" }, token),

    // Coupons
    getCoupons: (restaurantId: string, token: string) => request(`/restaurants/${restaurantId}/coupons`, {}, token),
    createCoupon: (restaurantId: string, data: any, token: string) =>
      request(`/restaurants/${restaurantId}/coupons`, { method: "POST", body: JSON.stringify(data) }, token),
    toggleCoupon: (restaurantId: string, id: string, token: string) =>
      request(`/restaurants/${restaurantId}/coupons/${id}/toggle`, { method: "PUT" }, token),
    deleteCoupon: (restaurantId: string, id: string, token: string) =>
      request(`/restaurants/${restaurantId}/coupons/${id}`, { method: "DELETE" }, token),

    // Reviews
    getReviews: (restaurantId: string, token: string) => request(`/restaurants/${restaurantId}/reviews`, {}, token),
    getReviewStats: (restaurantId: string, token: string) => request(`/restaurants/${restaurantId}/reviews/stats`, {}, token),

    // Reports
    getSalesReport: (restaurantId: string, token: string, startDate: string, endDate: string) =>
      request(`/restaurants/${restaurantId}/reports/sales?startDate=${startDate}&endDate=${endDate}`, {}, token),

    // Table auto-release
    autoReleaseTables: (restaurantId: string, token: string) =>
      request(`/admin/restaurants/${restaurantId}/tables/auto-release`, { method: "POST" }, token),
  };
}
