import React, { ReactNode, FC, ButtonHTMLAttributes } from "react";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  color?: "primary" | "white";
  label?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: FC<LoadingSpinnerProps> = ({
  size = "medium",
  color = "primary",
  label = "Loading...",
  fullScreen = false,
}) => {
  const sizeClasses = {
    small: "h-4 w-4 border-2",
    medium: "h-8 w-8 border-3",
    large: "h-12 w-12 border-4",
  };

  const colorClasses = {
    primary: "border-blue-600 border-t-transparent",
    white: "border-white border-t-transparent",
  };

  const containerClasses = fullScreen
    ? "fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50"
    : "flex items-center justify-center";

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      <div className="flex flex-col items-center">
        <div className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}>
          <span className="sr-only">{label}</span>
        </div>
        {label && (
          <span className={`mt-2 text-sm ${color === "white" ? "text-white" : "text-gray-700"}`}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

export default React.memo(LoadingSpinner);

export function withLoading<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  loadingProps?: LoadingSpinnerProps
): FC<P & { isLoading: boolean }> {
  const WithLoadingComponent: FC<P & { isLoading: boolean }> = ({ isLoading, ...props }) => {
    return isLoading ? (
      <LoadingSpinner {...loadingProps} />
    ) : (
      <WrappedComponent {...(props as P)} />
    );
  };

  WithLoadingComponent.displayName = `WithLoading(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return WithLoadingComponent;
}

export const LoadingOverlay: FC<{ isVisible: boolean } & LoadingSpinnerProps> = ({
  isVisible,
  ...props
}) => {
  return isVisible ? (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
      <LoadingSpinner {...props} />
    </div>
  ) : null;
};

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  children: ReactNode;
}

export const LoadingButton: FC<LoadingButtonProps> = ({
  isLoading,
  disabled,
  children,
  ...props
}) => {
  return (
    <button
      disabled={isLoading || disabled}
      className={`relative inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 ${isLoading ? "cursor-wait" : disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      {...props}
    >
      {isLoading && <LoadingSpinner size="small" color="white" label="" />}
      <span className={isLoading ? "ml-2 opacity-75" : ""}>{children}</span>
    </button>
  );
};
