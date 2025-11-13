import React, { useEffect } from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({ open, title = 'Confirm', message = 'Are you sure?', onConfirm, onCancel }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel && onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="confirm-modal-overlay" role="dialog" aria-modal="true">
      <div className="confirm-modal">
        <h3 className="confirm-modal-title font-montserrat-medium">{title}</h3>
        <p className="confirm-modal-message font-inter-regular">{message}</p>

        <div className="confirm-modal-actions">
          <button className="confirm-cancel font-inter-medium" onClick={onCancel}>Cancel</button>
          <button className="confirm-ok font-inter-medium" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
