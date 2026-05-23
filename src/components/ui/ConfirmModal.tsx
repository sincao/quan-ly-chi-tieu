'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'primary';
  loading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  open, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Xác nhận', 
  cancelText = 'Hủy',
  type = 'primary',
  loading = false
}) => {
  if (!open) return null;

  return (
    <div className="scrim" onClick={onClose} style={{ zIndex: 300 }}>
      <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="close" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--t2)', lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>{cancelText}</button>
          <button 
            className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`} 
            onClick={onConfirm} 
            disabled={loading}
            style={type === 'danger' ? { background: 'var(--rose)', color: '#fff' } : {}}
          >
            {loading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
