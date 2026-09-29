import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeliveryPointForm } from '@/components/DeliveryPointForm';

describe('DeliveryPointForm', () => {
  it('muestra error si se envía sin referencia', async () => {
    const onSubmit = vi.fn();
    render(<DeliveryPointForm onSubmit={onSubmit} loading={false} error={null} />);

    fireEvent.click(screen.getByRole('button', { name: /agregar punto/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/referencia es obligatoria/i);
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('muestra error si hay referencia pero no hay dirección', async () => {
    const onSubmit = vi.fn();
    render(<DeliveryPointForm onSubmit={onSubmit} loading={false} error={null} />);

    fireEvent.change(screen.getByLabelText(/referencia/i), {
      target: { value: 'Mi cliente' },
    });
    fireEvent.click(screen.getByRole('button', { name: /agregar punto/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/dirección es obligatoria/i);
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('llama onSubmit con reference y address', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<DeliveryPointForm onSubmit={onSubmit} loading={false} error={null} />);

    fireEvent.change(screen.getByLabelText(/referencia/i), {
      target: { value: 'Tienda Norte' },
    });
    fireEvent.change(screen.getByLabelText(/dirección/i), {
      target: { value: 'Av. Insurgentes 123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /agregar punto/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        reference: 'Tienda Norte',
        address: 'Av. Insurgentes 123',
      });
    });
  });

  it('no expone campos de latitud ni longitud', () => {
    render(<DeliveryPointForm onSubmit={vi.fn()} loading={false} error={null} />);
    expect(screen.queryByLabelText(/latitud/i)).toBeNull();
    expect(screen.queryByLabelText(/longitud/i)).toBeNull();
  });

  it('deshabilita el botón mientras loading=true', () => {
    const onSubmit = vi.fn();
    render(<DeliveryPointForm onSubmit={onSubmit} loading={true} error={null} />);
    expect(screen.getByRole('button', { name: /registrando/i })).toBeDisabled();
  });

  it('muestra error del servidor', () => {
    render(
      <DeliveryPointForm
        onSubmit={vi.fn()}
        loading={false}
        error="La ubicación del punto no es válida."
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/ubicación/i);
  });
});
