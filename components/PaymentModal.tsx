
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { paymentService } from '../services/paymentService';
import type { PixCharge } from '../types';
import { CreditCardIcon, PixIcon, BankIcon, CheckIcon, LoadingSpinnerIcon, CopyIcon, ClipboardCheckIcon } from './icons';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PaymentStep = 'selectPackage' | 'generatingPix' | 'showPix' | 'paymentSuccess' | 'pixNotConfigured';
type PaymentTab = 'packages' | 'custom';

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const { user, addCredits } = useAuth();
  const [step, setStep] = useState<PaymentStep>('selectPackage');
  const [pixCharge, setPixCharge] = useState<PixCharge | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Package state
  const [selectedPackage, setSelectedPackage] = useState({ credits: 50, price: '45,00' });
  const packages = [
    { credits: 10, price: '10,00' },
    { credits: 50, price: '45,00' },
    { credits: 100, price: '80,00' },
  ];

  // Custom purchase state
  const [activeTab, setActiveTab] = useState<PaymentTab>('packages');
  const [customCredits, setCustomCredits] = useState(100);
  const CREDIT_PRICE = 0.25;

  const getPrice = () => {
    if (activeTab === 'packages') {
      return selectedPackage.price;
    }
    return (customCredits * CREDIT_PRICE).toFixed(2).replace('.', ',');
  };
  const getCredits = () => {
    if (activeTab === 'packages') {
      return selectedPackage.credits;
    }
    return customCredits;
  };
  
  useEffect(() => {
    if (isOpen) {
      setStep('selectPackage');
      setActiveTab('packages');
      setPixCharge(null);
      setIsCopied(false);
      setSelectedPackage({ credits: 50, price: '45,00' });
      setCustomCredits(100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === 'showPix' && pixCharge && pixCharge.transactionId !== 'not-configured') {
      const interval = setInterval(async () => {
        try {
          const { status, amount } = await paymentService.getPaymentStatus(pixCharge.transactionId);
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
    if (!user) {
        alert("You must be logged in to purchase credits.");
        return;
    }
    setStep('generatingPix');
    try {
      const charge = await paymentService.createPixCharge(getPrice(), getCredits(), user.id);
      if (charge.transactionId === 'not-configured') {
        setPixCharge(charge);
        setStep('pixNotConfigured');
      } else {
        setPixCharge(charge);
        setStep('showPix');
      }
    } catch (error) {
      console.error("Failed to create PIX charge", error);
      setStep('selectPackage');
    }
  };

  const handleCopy = () => {
    if (pixCharge?.copyPasteCode) {
      navigator.clipboard.writeText(pixCharge.copyPasteCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleCustomCreditChange = (value: string) => {
      const numValue = Math.max(10, Math.min(1000, parseInt(value, 10) || 10));
      setCustomCredits(numValue);
  }
  
  const TabButton: React.FC<{tab: PaymentTab, children: React.ReactNode}> = ({ tab, children }) => {
      const isActive = activeTab === tab;
      return (
          <button
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors rounded-t-lg
                  ${isActive 
                      ? 'bg-slate-800 text-white' 
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-800/60'
                  }`}
          >
              {children}
          </button>
      )
  };


  const renderContent = () => {
    switch (step) {
      case 'paymentSuccess':
        return (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <CheckIcon className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-white">Payment Successful!</h2>
            <p className="text-slate-300 mt-2">{getCredits()} credits have been added to your account.</p>
          </div>
        );
      case 'generatingPix':
        return (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <LoadingSpinnerIcon className="w-12 h-12 animate-spin text-purple-400 mb-4" />
            <h2 className="text-xl font-bold text-white">Generating PIX charge...</h2>
          </div>
        );
      case 'pixNotConfigured':
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-amber-400">PIX Not Configured</h2>
                <p className="text-slate-300 mt-2">The administrator has not yet configured a PIX key to receive payments.</p>
                <p className="text-slate-400 text-sm mt-1">Please contact support or try again later.</p>
                <div className="mt-6">
                    <button onClick={onClose} className="px-4 py-2 font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-500">
                        Understood
                    </button>
                </div>
            </div>
        );
      case 'showPix':
        return (
          <>
            <div className="p-6 border-b border-slate-700 text-center">
                <h2 className="text-2xl font-bold text-white">Scan to Pay</h2>
                <p className="text-slate-400">Scan the QR code with your bank's app.</p>
            </div>
            <div className="p-6 flex flex-col items-center gap-4">
              <div className="w-48 h-48 rounded-lg bg-white p-2">
                <img src={pixCharge?.qrCodeDataUrl} alt="PIX QR Code" className="w-full h-full" />
              </div>
              <div className="text-center text-slate-300 font-semibold">
                <LoadingSpinnerIcon className="inline w-4 h-4 mr-2 animate-spin" />
                Aguardando pagamento...
              </div>
              <div className="w-full bg-slate-900/50 p-3 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">PIX Copia e Cola:</p>
                <div className="flex items-center gap-2">
                    <p className="text-xs font-mono text-slate-200 truncate flex-1">{pixCharge?.copyPasteCode}</p>
                    <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-slate-600 transition-colors">
                        {isCopied ? <ClipboardCheckIcon className="w-5 h-5 text-green-400"/> : <CopyIcon className="w-5 h-5 text-slate-400" />}
                    </button>
                </div>
              </div>
            </div>
             <div className="p-6 bg-slate-900/50 rounded-b-lg flex justify-end gap-4">
                <button onClick={onClose} className="px-4 py-2 font-semibold text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600">Cancel</button>
            </div>
          </>
        );
      case 'selectPackage':
      default:
        return (
          <>
            <div className="p-6 border-b border-slate-700">
                <h2 className="text-2xl font-bold text-white">Buy Credits</h2>
                <p className="text-slate-400">Select an option to add credits to your account.</p>
            </div>
            <div className="p-6">
                <div className="flex gap-1 bg-slate-700/50 p-1 rounded-lg">
                    <TabButton tab="packages">Pacotes</TabButton>
                    <TabButton tab="custom">Personalizado</TabButton>
                </div>
                
                <div className="bg-slate-800 p-6 rounded-b-lg">
                    {activeTab === 'packages' && (
                        <div className="grid grid-cols-3 gap-4">
                            {packages.map(pkg => (
                                <button key={pkg.credits} onClick={() => setSelectedPackage(pkg)} className={`p-4 border-2 rounded-lg text-center transition-colors ${selectedPackage.credits === pkg.credits && activeTab === 'packages' ? 'border-purple-500 bg-purple-900/50' : 'border-slate-600 hover:border-purple-400'}`}>
                                    <p className="text-xl font-bold text-amber-400">{pkg.credits}</p>
                                    <p className="text-sm text-slate-300">Credits</p>
                                    <p className="text-xs text-slate-400 mt-2">R$ {pkg.price}</p>
                                </button>
                            ))}
                        </div>
                    )}
                    {activeTab === 'custom' && (
                        <div className="space-y-4">
                            <div className="text-center">
                               <p className="text-4xl font-bold text-amber-400">{customCredits}</p>
                               <p className="text-sm text-slate-300">Credits</p>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="1000"
                                step="10"
                                value={customCredits}
                                onChange={(e) => handleCustomCreditChange(e.target.value)}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                             <div className="flex items-center gap-2">
                                <input type="number" value={customCredits} onChange={(e) => handleCustomCreditChange(e.target.value)} className="w-24 bg-slate-700 border border-slate-600 rounded-md p-1 text-center" />
                                <span className="text-slate-400 text-sm">R$ {(customCredits * CREDIT_PRICE).toFixed(2)}</span>
                             </div>
                        </div>
                    )}
                </div>
                
                <div className="mt-6">
                    <div className="flex">
                        <button className="flex-1 p-3 flex items-center justify-center gap-2 text-sm font-semibold rounded-t-lg bg-slate-700 text-white">
                            <PixIcon className="w-5 h-5"/> PIX
                        </button>
                         <div className="flex-1 p-3 flex items-center justify-center gap-2 text-sm font-semibold rounded-t-lg bg-slate-800 text-slate-500 cursor-not-allowed" title="Coming soon">
                            <CreditCardIcon className="w-5 h-5"/> Credit Card
                        </div>
                         <div className="flex-1 p-3 flex items-center justify-center gap-2 text-sm font-semibold rounded-t-lg bg-slate-800 text-slate-500 cursor-not-allowed" title="Coming soon">
                            <BankIcon className="w-5 h-5"/> Debit Card
                        </div>
                    </div>
                     <div className="bg-slate-700 p-6 rounded-b-lg text-center">
                        <p className="text-slate-300 text-sm">You will be redirected to generate a PIX QR Code.</p>
                    </div>
                </div>
            </div>
            <div className="p-6 bg-slate-900/50 rounded-b-lg flex justify-end gap-4">
                <button onClick={onClose} className="px-4 py-2 font-semibold text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600">Cancel</button>
                <button onClick={handleCreatePix} className="px-4 py-2 font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-500">
                    Pay R$ {getPrice()} with PIX
                </button>
            </div>
          </>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        {renderContent()}
      </div>
    </div>
  );
};

export default PaymentModal;