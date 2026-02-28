import { toast as sonnerToast } from 'sonner';

// Create a callable toast function that also has methods
interface ToastFunction {
  (message: string, description?: string): void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  loading: (message: string) => string | number;
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => any;
}

// Base function - defaults to info toast
const toastFunction = ((message: string, description?: string) => {
  sonnerToast(message, { description });
}) as ToastFunction;

// Add methods to the function
toastFunction.success = (message: string, description?: string) => {
  sonnerToast.success(message, { description });
};

toastFunction.error = (message: string, description?: string) => {
  sonnerToast.error(message, { description });
};

toastFunction.info = (message: string, description?: string) => {
  sonnerToast.info(message, { description });
};

toastFunction.warning = (message: string, description?: string) => {
  sonnerToast.warning(message, { description });
};

toastFunction.loading = (message: string) => {
  return sonnerToast.loading(message);
};

toastFunction.promise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
): any => {
  return sonnerToast.promise(promise, messages);
};

export const toast = toastFunction;
export default toast;
