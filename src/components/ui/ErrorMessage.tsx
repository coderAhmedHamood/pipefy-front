import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'error' | 'warning' | 'info';
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  onDismiss,
  variant = 'error',
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-red-500';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getVariantStyles()} ${className}`}>
      <div className="flex items-start">
        <AlertCircle className={`w-5 h-5 ${getIconColor()} mt-0.5 flex-shrink-0`} />
        
        <div className="mr-3 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse mr-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              title="إعادة المحاولة"
            >
              <RefreshCw className="w-3 h-3 ml-1" />
              إعادة المحاولة
            </button>
          )}
          
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="inline-flex items-center justify-center w-6 h-6 rounded-md hover:bg-white hover:bg-opacity-50 transition-colors"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
