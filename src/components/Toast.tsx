import React from 'react';

interface Props {
  message: string;
  type?: 'info' | 'success' | 'warning';
}

/**
 * Aviso no intrusivo para notificaciones como "Ruta actualizada".
 */
export function Toast({ message, type = 'info' }: Props) {
  return (
    <div className={`toast toast-${type}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
