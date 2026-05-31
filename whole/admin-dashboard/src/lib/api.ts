import { createAdminApi } from '../../../../shared/adminApi';
import { getApiUrl } from '../../../../shared/config';

const BASE = getApiUrl();

export const adminApi = createAdminApi(BASE);
