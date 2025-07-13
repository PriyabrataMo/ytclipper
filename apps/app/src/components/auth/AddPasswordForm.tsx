import React, { useState } from 'react';

interface AddPasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AddPasswordForm: React.FC<AddPasswordFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      setSuccess(
        'Password added successfully! You can now login with email and password.',
      );
      setPassword('');
      setConfirmPassword('');

      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add password. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='max-w-md mx-auto bg-white rounded-lg shadow-md p-6'>
      <h2 className='text-2xl font-bold text-gray-900 mb-6 text-center'>
        Add Password Authentication
      </h2>

      <p className='text-gray-600 mb-6 text-center'>
        Add a password to your account so you can login with email and password
        in addition to Google.
      </p>

      {error ? (
        <div className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
          {error}
        </div>
      ) : null}

      {success ? (
        <div className='mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded'>
          {success}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label
            htmlFor='password'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            New Password
          </label>
          <input
            id='password'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            placeholder='Enter your new password'
          />
        </div>

        <div>
          <label
            htmlFor='confirmPassword'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Confirm Password
          </label>
          <input
            id='confirmPassword'
            type='password'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            placeholder='Confirm your new password'
          />
        </div>

        <div className='flex space-x-4'>
          <button
            type='submit'
            disabled={loading}
            className='flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? 'Adding Password...' : 'Add Password'}
          </button>

          {onCancel ? (
            <button
              type='button'
              onClick={onCancel}
              className='flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
};
