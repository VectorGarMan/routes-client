interface Props {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div className="error-message" role="alert">
      <span>⚠️ {message}</span>
      {onRetry && (
        <button className="btn btn-secondary btn-sm" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
