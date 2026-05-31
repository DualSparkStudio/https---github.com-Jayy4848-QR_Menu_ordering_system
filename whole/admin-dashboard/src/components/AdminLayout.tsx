import { useAuthStore } from '@/store/authStore';
import { createAdminLayout } from '../../../shared/adminComponents';

const AdminLayout = createAdminLayout(useAuthStore);
export default AdminLayout;
