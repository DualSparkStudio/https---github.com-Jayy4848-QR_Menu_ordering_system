import { useAuthStore } from '@/store/authStore';
import { createLoginPage } from '../../../shared/adminComponents';

const LoginPage = createLoginPage(useAuthStore);
export default LoginPage;
