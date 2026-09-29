import { describe, it, expect, vi, afterEach } from 'vitest';

/**
 * Pruebas del cliente HTTP: desenvoltura de ApiResponse y mapeo de errores.
 */

function mockFetch(body: unknown, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    })
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('httpClient — ApiResponse unwrapping', () => {
  it('devuelve data cuando success=true', async () => {
    mockFetch({ success: true, message: 'OK', data: { id: '123' }, error: null });
    // Importar dinámicamente para que fetch mockeado esté listo
    const { http } = await import('@/services/httpClient');
    const result = await http.get<{ id: string }>('/test');
    expect(result).toEqual({ id: '123' });
  });
});

describe('httpClient — error mapping', () => {
  it('lanza ApiDomainError cuando success=false', async () => {
    mockFetch(
      { success: false, message: 'Error', data: null, error: { code: 'LOCATION_INVALID', details: null } },
      400
    );
    const { http, ApiDomainError } = await import('@/services/httpClient');
    await expect(http.get('/test')).rejects.toBeInstanceOf(ApiDomainError);
  });

  it('mapea LOCATION_INVALID a mensaje amigable en español', async () => {
    mockFetch(
      { success: false, message: 'Bad', data: null, error: { code: 'LOCATION_INVALID', details: null } },
      400
    );
    const { http, ApiDomainError } = await import('@/services/httpClient');
    try {
      await http.get('/test');
      expect.fail('Debería haber lanzado un error');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiDomainError);
      expect((err as InstanceType<typeof ApiDomainError>).code).toBe('LOCATION_INVALID');
      expect((err as InstanceType<typeof ApiDomainError>).message).toContain('ubicación');
    }
  });

  it('mapea error 503 con httpStatus correcto', async () => {
    mockFetch(
      { success: false, message: 'Unavailable', data: null, error: { code: 'SOME_CODE', details: null } },
      503
    );
    const { http, ApiDomainError } = await import('@/services/httpClient');
    try {
      await http.get('/test');
      expect.fail('Debería haber lanzado un error');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiDomainError);
      expect((err as InstanceType<typeof ApiDomainError>).httpStatus).toBe(503);
    }
  });

  it('VALIDATION_ERROR conserva el mensaje específico del backend', async () => {
    mockFetch(
      {
        success: false,
        message: 'Debe marcarse primero la parada pendiente con order=2',
        data: null,
        error: { code: 'VALIDATION_ERROR', details: null },
      },
      400
    );
    const { http, ApiDomainError } = await import('@/services/httpClient');
    try {
      await http.post('/test');
      expect.fail('Debería haber lanzado un error');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiDomainError);
      expect((err as InstanceType<typeof ApiDomainError>).code).toBe('VALIDATION_ERROR');
      expect((err as InstanceType<typeof ApiDomainError>).message).toBe(
        'Debe marcarse primero la parada pendiente con order=2'
      );
    }
  });

  it.each([
    ['ROUTE_INFEASIBLE', 422, 'ruta viable'],
    ['MAPS_RATE_LIMIT', 429, 'límite de consultas'],
    ['MAPS_UNAVAILABLE', 503, 'servicio de mapas'],
    ['OPTIMIZER_UNAVAILABLE', 503, 'servicio de optimización'],
  ])('mapea el código real %s (HTTP %i) a un mensaje amigable', async (code, status, fragment) => {
    mockFetch(
      { success: false, message: 'texto interno', data: null, error: { code, details: null } },
      status
    );
    const { http, ApiDomainError } = await import('@/services/httpClient');
    try {
      await http.post('/test');
      expect.fail('Debería haber lanzado un error');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiDomainError);
      expect((err as InstanceType<typeof ApiDomainError>).code).toBe(code);
      expect((err as InstanceType<typeof ApiDomainError>).message).toContain(fragment);
    }
  });

  it('mapea error 404 a mensaje de recurso no encontrado', async () => {
    mockFetch(
      { success: false, message: 'Not found', data: null, error: { code: 'ROUTE_NOT_FOUND', details: null } },
      404
    );
    const { http, ApiDomainError } = await import('@/services/httpClient');
    try {
      await http.get('/test');
      expect.fail('Debería haber lanzado un error');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiDomainError);
      expect((err as InstanceType<typeof ApiDomainError>).message).toContain('no fue encontrado');
    }
  });
});
