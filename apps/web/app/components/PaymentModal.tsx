'use client';

import { useState } from 'react';
import { Smartphone } from 'lucide-react';

interface PaymentModalProps {
  amount: number;
  title: string;
  onConfirm: (method: string, phone: string) => void;
  onClose: () => void;
  quantity?: number;
  onQuantityChange?: (qty: number) => void;
  maxQuantity?: number;
}

const PAYMENT_METHODS = [
  { id: 'orange_money', name: 'Orange Money', color: '#f60', label: 'OM' },
  { id: 'mtn_money', name: 'MTN Mobile Money', color: '#ffc107', label: 'MTN' },
  { id: 'moov_money', name: 'Moov Money', color: '#0066ff', label: 'Moov' },
  { id: 'wave', name: 'Wave', color: '#1dc3f0', label: 'Wave' },
];

export default function PaymentModal({ amount, title, onConfirm, onClose, quantity, onQuantityChange, maxQuantity = 10 }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('orange_money');
  const [phone, setPhone] = useState('');

  const total = quantity ? amount * quantity : amount;

  const handleSubmit = () => {
    const cleaned = phone.replace(/[\s\-+]/g, '');
    if (cleaned.length < 8) return;
    onConfirm(selectedMethod, cleaned);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-dark-800/95 backdrop-blur-xl rounded-2xl max-w-md w-full p-6 border border-dark-700/50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-dark-400 mb-6">Choisissez votre méthode de paiement</p>

        {quantity !== undefined && onQuantityChange && (
          <div className="flex items-center justify-between mb-4 bg-dark-700/50 rounded-xl px-4 py-3">
            <span className="text-sm text-dark-200 font-medium">Nombre de tickets</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-full bg-dark-600 hover:bg-dark-500 flex items-center justify-center text-white font-bold transition-colors"
              >
                -
              </button>
              <span className="w-8 text-center font-semibold text-white">{quantity}</span>
              <button
                onClick={() => onQuantityChange(Math.min(maxQuantity, quantity + 1))}
                className="w-8 h-8 rounded-full bg-dark-600 hover:bg-dark-500 flex items-center justify-center text-white font-bold transition-colors"
              >
                +
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedMethod === method.id
                  ? 'border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/10'
                  : 'border-dark-600 hover:border-dark-500 hover:bg-dark-700/50'
              }`}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: method.color }}
              >
                {method.label}
              </div>
              <div className="text-left">
                <p className="font-medium text-white">{method.name}</p>
              </div>
              {selectedMethod === method.id && (
                <svg className="w-5 h-5 text-primary-400 ml-auto" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              )}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <label className="text-sm text-dark-300 font-medium mb-1.5 block">Numéro de téléphone</label>
          <div className="relative">
            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07 07 07 07 07"
              className="w-full bg-dark-700/50 border border-dark-600 rounded-xl pl-10 pr-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
          <p className="text-[11px] text-dark-500 mt-1">Un code USSD sera envoyé pour confirmer le paiement</p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={phone.replace(/[\s\-+]/g, '').length < 8}
          className="w-full mt-5 btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Payer {total.toLocaleString('fr-FR')} FCFA
        </button>

        <button onClick={onClose} className="w-full mt-2 text-sm text-dark-400 hover:text-white py-2 transition-colors">
          Annuler
        </button>
      </div>
    </div>
  );
}
