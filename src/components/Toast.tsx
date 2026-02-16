'use client';

import { Toast } from '@/hooks/useToast';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: number) => void;
}

const typeStyles: Record<Toast['type'], string> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-gray-800',
};

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-[70] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          onClick={() => onRemove(toast.id)}
          className={`${typeStyles[toast.type]} text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-lg pointer-events-auto cursor-pointer animate-fade-in`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
