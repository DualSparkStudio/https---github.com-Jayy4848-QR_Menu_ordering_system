import { adminApi } from '@/lib/api';
import { createAdminStore } from '../../../shared/adminStore';

export { type AdminUser, type AuthState } from '../../../shared/adminStore';

export const useAdminStore = createAdminStore(adminApi);
