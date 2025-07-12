import React, { useState } from 'react';

interface FloatingTimestampButtonProps {
  onAddTimestamp: (timestamp: number, title?: string, note?: string) => void;
  currentTime: number;
  isVisible: boolean;
  onClose: () => void;
}

interface QuickTimestampForm {
  title: string;
  note: string;
}

export const FloatingTimestampButton: React.FC<
  FloatingTimestampButtonProps
> = ({ onAddTimestamp, currentTime, isVisible, onClose }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<QuickTimestampForm>({
    title: '',
    note: '',
  });

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleQuickAdd = () => {
    onAddTimestamp(currentTime);
    setShowForm(false);
    setForm({ title: '', note: '' });
  };

  const handleDetailedAdd = () => {
    setShowForm(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTimestamp(
      currentTime,
      form.title || undefined,
      form.note || undefined,
    );
    setShowForm(false);
    setForm({ title: '', note: '' });
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setForm({ title: '', note: '' });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className='ytclipper-floating-container'>
      {!showForm ? (
        <div className='ytclipper-floating-button'>
          <button
            className='ytclipper-quick-add'
            onClick={handleQuickAdd}
            title={`Add timestamp at ${formatTime(currentTime)}`}
          >
            <span>clock</span>
            <span>{formatTime(currentTime)}</span>
          </button>

          <button
            className='ytclipper-detailed-add'
            onClick={handleDetailedAdd}
            title='Add timestamp with details'
          >
            <span>plus</span>
          </button>

          <button
            className='ytclipper-close'
            onClick={onClose}
            title='Close timestamp tool'
          >
            <span>x</span>
          </button>
        </div>
      ) : (
        <div className='ytclipper-floating-form'>
          <div className='ytclipper-form-header'>
            <span>clock</span>
            <span>Add Timestamp - {formatTime(currentTime)}</span>
            <button
              className='ytclipper-form-close'
              onClick={handleFormCancel}
              title='Cancel'
            >
              <span>x</span>
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className='ytclipper-form-content'>
            <input
              type='text'
              placeholder='Title (optional)'
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              className='ytclipper-form-input'
            />

            <textarea
              placeholder='Note (optional)'
              value={form.note}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, note: e.target.value }))
              }
              className='ytclipper-form-textarea'
              rows={2}
            />

            <div className='ytclipper-form-actions'>
              <button
                type='button'
                onClick={handleFormCancel}
                className='ytclipper-btn-secondary'
              >
                Cancel
              </button>
              <button type='submit' className='ytclipper-btn-primary'>
                Add Timestamp
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
