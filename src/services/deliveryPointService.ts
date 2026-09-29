import { http } from './httpClient';
import type { DeliveryPointRequest, DeliveryPointResponse } from '@/models';

export const deliveryPointService = {
  /**
   * Registra un nuevo punto de entrega.
   * POST /api/v1/delivery-points
   */
  create(payload: DeliveryPointRequest): Promise<DeliveryPointResponse> {
    return http.post<DeliveryPointResponse>('/api/v1/delivery-points', payload);
  },
};
