export declare const ORDER_STATUSES: {
    readonly PENDING: "pending";
    readonly CONFIRMED: "confirmed";
    readonly PREPARING: "preparing";
    readonly READY: "ready";
    readonly SERVED: "served";
    readonly COMPLETED: "completed";
    readonly CANCELLED: "cancelled";
};
export type OrderStatus = typeof ORDER_STATUSES[keyof typeof ORDER_STATUSES];
export declare const ITEM_STATUSES: {
    readonly PENDING: "pending";
    readonly PREPARING: "preparing";
    readonly READY: "ready";
    readonly SERVED: "served";
};
export type ItemStatus = typeof ITEM_STATUSES[keyof typeof ITEM_STATUSES];
export declare const STATUS_COLORS: Record<string, string>;
export declare const STATUS_LABELS: Record<string, string>;
export declare const STATUS_OPTIONS: {
    value: string;
    label: string;
}[];
export declare const ITEM_STATUS_OPTIONS: {
    value: string;
    label: string;
}[];
export declare const ORDER_FILTERS: string[];
export declare const FILTER_LABELS: Record<string, string>;
export declare const STATUS_NEXT: Record<string, string>;
export declare const STATUS_NEXT_LABEL: Record<string, string>;
export declare const ORDER_TO_ITEM_STATUS: Record<string, string>;
export declare const NOTIFICATION_TYPES: {
    readonly ORDER_PLACED: "order_placed";
    readonly ORDER_UPDATED: "order_updated";
    readonly ORDER_STATUS: "order_status";
};
export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];
export declare const TIME_CONSTANTS: {
    NEW_ORDER_THRESHOLD: number;
    DELAYED_ORDER_THRESHOLD: number;
    RECENT_ITEM_THRESHOLD: number;
    POLLING_INTERVAL: number;
};
export declare const ORDER_CARD_COLORS: {
    DELAYED: string;
    NEW: string;
    UPDATED: string;
    DEFAULT: string;
};
export declare const ORDER_CARD_BORDER_COLORS: {
    DELAYED: string;
    NEW: string;
    UPDATED: string;
    DEFAULT: string;
};
//# sourceMappingURL=constants.d.ts.map