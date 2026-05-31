import { adminApi } from '@/lib/api';
import { createAuthStore } from '../../../shared/authStore';

export { type StaffUser as Staff, type AuthStoreState as AuthStore } from '../../../shared/authStore';

export const useAuthStore = createAuthStore(adminApi);
