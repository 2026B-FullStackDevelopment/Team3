import { httpClient } from '@/shared/api/apiFetch.js'
import { profileRoutes } from '@/config/api/routes/index.js'

/**
 * Premium checkout Service (Wallet module, F8). Calls the profile subscribe
 * endpoint through the shared route config — the documented cross-domain usage
 * (FE_ARCHITECTURE §11); it never imports identity code.
 */
export const premiumService = {
  getStatus: () => httpClient.get(profileRoutes.get),
  subscribe: () => httpClient.post(profileRoutes.subscribe),
  subscribeWithCard: () => httpClient.post(profileRoutes.subscribeCheckout),
}
