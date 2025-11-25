import { useState } from 'react';
import { Lock } from 'lucide-react';
import { signIn } from '../lib/auth';

interface LoginProps {
  onSuccess: () => void;
}

export function Login({ onSuccess }: LoginProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(pin);
      onSuccess();
    } catch (err) {
      setError('Invalid PIN');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPin(value);
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center mb-8">
          <div className="p-3 bg-blue-100 rounded-full">
            <Lock className="text-blue-600" size={24} />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
          Enter Admin PIN
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="pin" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Enter 6-digit PIN
            </label>
            <input
              id="pin"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={handlePinChange}
              className="w-full px-4 py-2 text-center text-2xl tracking-widest border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || pin.length !== 6}
            className={`w-full py-2 px-4 rounded-lg text-white font-medium
              ${loading || pin.length !== 6
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
              }`}
          >
            {loading ? 'Verifying...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}