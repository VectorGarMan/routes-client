interface Props {
  message?: string;
}

export function LoadingSpinner({ message = 'Cargando…' }: Props) {
  return (
    <div className="loading-spinner" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
