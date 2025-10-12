import React from 'react';

interface ConfirmationModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  message,
  onConfirm,
  onCancel,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  confirmButtonClass = 'bg-error text-white hover:opacity-90'
}) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in" 
      role="dialog" 
      aria-modal="true"
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-800 mb-4">Xác nhận hành động</h3>
        <p className="text-gray-600 mb-6 whitespace-pre-wrap">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`font-bold py-2 px-4 rounded-md transition-colors ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
