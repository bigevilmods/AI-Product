
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { paymentService } from '../services/paymentService';
import type { PixCharge } from '../types';
import { CreditCardIcon, PixIcon, BankIcon, CheckIcon, LoadingSpinnerIcon, CopyIcon, ClipboardCheckIcon } from './icons';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PaymentStep = 'selectPackage' | 'generatingPix' | 'showPix' | 'processingCard' | 'paymentSuccess' | 'paymentError';
type PaymentTab = 'packages' | 'custom';
type PaymentMethod = 'pix' | 'credit' | 'debit';

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const { user, addCredits } = useAuth();
  const [step, setStep] = useState<PaymentStep>('selectPackage');
  const [pixCharge, setPixCharge] = useState<PixCharge | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // State
  const [selectedPackage, setSelectedPackage] = useState({ credits: 50, price: '10.00' });
  const [activeTab, setActiveTab] = useState<PaymentTab>('packages');
  const [customCredits, setCustomCredits] = useState(100);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [cardInfo, setCardInfo] = useState({ number: '', name: '', expiry: '', cvv: '' });

  const CREDIT_PRICE = 0.25;
  const packages = [
    { credits: 10, price: '2.50' },
    { credits: 50, price: '10.00' },
    { credits: 100, price: '18.00' },
  ];

  const getPrice = () => activeTab === 'packages' ? selectedPackage.price : (customCredits * CREDIT_PRICE).toFixed(2);
  const getCredits = () => activeTab === 'packages' ? selectedPackage.credits : customCredits;
  
  const resetState = () => {
    setStep('selectPackage');
    setActiveTab('packages');
    setPixCharge(null);
    setIsCopied(false);
    setSelectedPackage({ credits: 50, price: '10.00' });
    setCustomCredits(100);
    setPaymentMethod('pix');
    setCardInfo({ number: '', name: '', expiry: '', cvv: '' });
    setErrorMessage('');
  };

  useEffect(() => {
    if (isOpen) resetState();
  }, [isOpen]);

  useEffect(() => {
    if (step === 'showPix' && pixCharge && pixCharge.id !== 'not-configured') {
      const interval = setInterval(async () => {
        try {
          const { status, amount } = await paymentService.getPaymentStatus(pixCharge.id);
          if (status === 'paid') {
            clearInterval(interval);
            addCredits(amount);
            setStep('paymentSuccess');
            setTimeout(onClose, 3000);
          }
        } catch (error) {
          console.error("Error checking payment status:", error);
          clearInterval(interval);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [step, pixCharge, addCredits, onClose]);

  const handleCreatePix = async () => {
    if (!user) { alert("You must be logged in to purchase credits."); return; }
    setStep('generatingPix');
    try {
      const charge = await paymentService.createPixCharge(getPrice(), getCredits(), user.id);
      if (charge.id === 'not-configured') {
        setErrorMessage(charge.point_of_interaction.transaction_data.qr_code);
        setStep('paymentError');
      } else {
        setPixCharge(charge);
        setStep('showPix');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create PIX charge.");
      setStep('paymentError');
    }
  };
  
  const handleCreateCardPayment = async () => {
      if (!user) { alert("You must be logged in to purchase credits."); return; }
      if (Object.values(cardInfo).some(v => !v)) {
        setErrorMessage("Please fill in all card details.");
        return;
      }
      setErrorMessage('');
      setStep('processingCard');
      try {
          const response = await paymentService.createCardPayment(getPrice(), getCredits(), user.id);
          if (response.status === 'approved') {
              addCredits(getCredits());
              setStep('paymentSuccess');
              setTimeout(onClose, 3000);
          } else {
              setErrorMessage(response.message);
              setStep('paymentError');
          }
      } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred.");
          setStep('paymentError');
      }
  };

  const handleCopy = () => {
    if (pixCharge?.point_of_interaction.transaction_data.qr_code) {
      navigator.clipboard.writeText(pixCharge.point_of_interaction.transaction_data.qr_code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleCustomCreditChange = (value: string) => {
      const numValue = Math.max(10, Math.min(1000, parseInt(value, 10) || 10));
      setCustomCredits(numValue);
  }
  
  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      let formattedValue = value;
      if (name === 'number') {
          formattedValue = value.replace(/[^\d]/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
      } else if (name === 'expiry') {
          formattedValue = value.replace(/[^\d]/g, '').replace(/(.{2})/, '$1/').trim().slice(0, 5);
      } else if (name === 'cvv') {
          formattedValue = value.replace(/[^\d]/g, '').slice(0, 4);
      }
      setCardInfo(prev => ({ ...prev, [name]: formattedValue }));
  }

  const PaymentMethodButton: React.FC<{method: PaymentMethod, children: React.ReactNode, icon: React.ReactNode}> = ({ method, children, icon }) => (
      <button 
          onClick={() => setPaymentMethod(method)}
          className={`flex-1 p-3 flex items-center justify-center gap-2 text-sm font-semibold rounded-t-lg transition-colors ${paymentMethod === method ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700/50'}`}
      >
          {icon} {children}
      </button>
  );

  const CardPaymentForm = () => (
      <div className="bg-slate-700 p-6 rounded-b-lg space-y-4">
        <p className="text-center text-xs text-amber-300 bg-amber-900/50 p-2 rounded-md">This is a simulated form. Do not enter real credit card details.</p>
        <div>
          <label className="text-xs text-slate-300">Card Number</label>
          <input type="text" name="number" value={cardInfo.number} onChange={handleCardInputChange} placeholder="0000 0000 0000 0000" className="w-full bg-slate-800 border border-slate-600 rounded p-2 mt-1 focus:ring-purple-500 focus:border-purple-500"/>
        </div>
        <div>
          <label className="text-xs text-slate-300">Name on Card</label>
          <input type="text" name="name" value={cardInfo.name} onChange={handleCardInputChange} placeholder="Your Name" className="w-full bg-slate-800 border border-slate-600 rounded p-2 mt-1 focus:ring-purple-500 focus:border-purple-500"/>
        </div>
        <div className="flex gap-4">
            <div className="flex-1">
                <label className="text-xs text-slate-300">Expiry (MM/YY)</label>
                <input type="text" name="expiry" value={cardInfo.expiry} onChange={handleCardInputChange} placeholder="MM/YY" className="w-full bg-slate-800 border border-slate-600 rounded p-2 mt-1 focus:ring-purple-500 focus:border-purple-500"/>
            </div>
            <div className="flex-1">
                <label className="text-xs text-slate-300">CVV</label>
                <input type="password" name="cvv" value={cardInfo.cvv} onChange={handleCardInputChange} placeholder="123" className="w-full bg-slate-800 border border-slate-600 rounded p-2 mt-1 focus:ring-purple-500 focus:border-purple-500"/>
            </div>
        </div>
        {errorMessage && <p className="text-red-400 text-sm text-center">{errorMessage}</p>}
      </div>
  );
  
  const renderContent = () => {
    switch (step) {
      case 'paymentSuccess': return (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <CheckIcon className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-white">Payment Successful!</h2>
            <p className="text-slate-300 mt-2">{getCredits()} credits have been added to your account.</p>
          </div>
      );
      case 'processingCard':
      case 'generatingPix': return (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <LoadingSpinnerIcon className="w-12 h-12 animate-spin text-purple-400 mb-4" />
            <h2 className="text-xl font-bold text-white">{step === 'processingCard' ? 'Processing Card Payment...' : 'Generating PIX...'}</h2>
            <p className="text-slate-400 mt-2">Connecting with Mercado Pago.</p>
          </div>
      );
      case 'paymentError': return (
          <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-red-400">Payment Failed</h2>
              <p className="text-slate-300 mt-2">{errorMessage}</p>
              <div className="mt-6 flex gap-4 justify-center">
                  <button onClick={resetState} className="px-4 py-2 font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-500">
                      Try Again
                  </button>
                  <button onClick={onClose} className="px-4 py-2 font-semibold text-white bg-slate-600 rounded-md hover:bg-slate-500">
                      Close
                  </button>
              </div>
          </div>
      );
      case 'showPix': return (
          <>
            <div className="p-6 border-b border-slate-700 text-center">
                <h2 className="text-2xl font-bold text-white">Scan to Pay with Mercado Pago</h2>
                <p className="text-slate-400">Scan the QR code with your bank's app.</p>
            </div>
            <div className="p-6 flex flex-col items-center gap-4">
              <div className="w-48 h-48 rounded-lg bg-white p-2">
                <img src={`data:image/jpeg;base64,${pixCharge?.point_of_interaction.transaction_data.qr_code_base64}`} alt="PIX QR Code" className="w-full h-full" />
              </div>
              <div className="text-center text-slate-300 font-semibold flex items-center">
                <LoadingSpinnerIcon className="inline w-4 h-4 mr-2 animate-spin" />
                Waiting for payment...
              </div>
              <div className="w-full bg-slate-900/50 p-3 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">PIX Copy & Paste:</p>
                <div className="flex items-center gap-2">
                    <p className="text-xs font-mono text-slate-200 truncate flex-1">{pixCharge?.point_of_interaction.transaction_data.qr_code}</p>
                    <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-slate-600 transition-colors">
                        {isCopied ? <ClipboardCheckIcon className="w-5 h-5 text-green-400"/> : <CopyIcon className="w-5 h-5 text-slate-400" />}
                    </button>
                </div>
              </div>
            </div>
             <div className="p-6 bg-slate-900/50 rounded-b-lg flex justify-end gap-4">
                <button onClick={onClose} className="px-4 py-2 font-semibold bg-slate-600 hover:bg-slate-500 rounded-md">Cancel</button>
            </div>
          </>
      );
      case 'selectPackage':
      default: return (
          <>
            <div className="p-6 pb-2"><h2 className="text-2xl font-bold text-white">Buy Credits</h2></div>
            <p className="text-slate-400 px-6 text-sm">Select an option to add credits to your account.</p>
            <div className="p-6">
                <div className="flex gap-1 bg-slate-700/50 p-1 rounded-lg">
                    {[{tab: 'packages', label: 'Packages'}, {tab: 'custom', label: 'Custom'}].map(({tab, label}) => 
                      <button key={tab} onClick={() => setActiveTab(tab as PaymentTab)} className={`flex-1 py-3 text-sm font-semibold transition-colors rounded-lg ${activeTab === tab ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:bg-slate-800/60'}`}>{label}</button>
                    )}
                </div>
                <div className="bg-slate-800 p-6 rounded-b-lg">
                    {activeTab === 'packages' ? (
                        <div className="grid grid-cols-3 gap-4">
                            {packages.map(pkg => (
                                <button key={pkg.credits} onClick={() => setSelectedPackage(pkg)} className={`p-4 border-2 rounded-lg text-center transition-colors ${selectedPackage.credits === pkg.credits && activeTab === 'packages' ? 'border-purple-500 bg-purple-900/50' : 'border-slate-600 hover:border-purple-400'}`}>
                                    <p className="text-xl font-bold text-amber-400">{pkg.credits}</p>
                                    <p className="text-sm text-slate-300">Credits</p>
                                    <p className="text-xs text-slate-400 mt-2">${pkg.price}</p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-center"><p className="text-4xl font-bold text-amber-400">{customCredits}</p><p className="text-sm text-slate-300">Credits</p></div>
                            <input type="range" min="10" max="1000" step="10" value={customCredits} onChange={(e) => handleCustomCreditChange(e.target.value)} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                             <div className="flex items-center gap-2"><input type="number" value={customCredits} onChange={(e) => handleCustomCreditChange(e.target.value)} className="w-24 bg-slate-700 border border-slate-600 rounded-md p-1 text-center" /><span className="text-slate-400 text-sm">$ {(customCredits * CREDIT_PRICE).toFixed(2)}</span></div>
                        </div>
                    )}
                </div>
                <div className="mt-6">
                    <div className="flex"><PaymentMethodButton method="pix" icon={<PixIcon className="w-5 h-5"/>}>PIX</PaymentMethodButton><PaymentMethodButton method="credit" icon={<CreditCardIcon className="w-5 h-5"/>}>Credit Card</PaymentMethodButton><PaymentMethodButton method="debit" icon={<BankIcon className="w-5 h-5"/>}>Debit Card</PaymentMethodButton></div>
                    {paymentMethod === 'pix' && <div className="bg-slate-700 p-6 rounded-b-lg text-center"><p className="text-slate-300 text-sm">You will be redirected to generate a PIX QR Code.</p></div>}
                    {(paymentMethod === 'credit' || paymentMethod === 'debit') && <CardPaymentForm />}
                </div>
            </div>
            <div className="p-6 bg-slate-900/50 rounded-b-lg flex justify-end gap-4">
                <button onClick={onClose} className="px-4 py-2 font-semibold bg-slate-600 hover:bg-slate-500 rounded-md">Cancel</button>
                <button onClick={paymentMethod === 'pix' ? handleCreatePix : handleCreateCardPayment} className="px-4 py-2 font-semibold bg-purple-600 hover:bg-purple-500 rounded-md">
                    Pay ${getPrice()}
                </button>
            </div>
          </>
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        {renderContent()}
      </div>
    </div>
  );
};

export default PaymentModal;