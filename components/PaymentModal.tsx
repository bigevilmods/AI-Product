import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { paymentService } from '../services/paymentService';
// FIX: Imported the missing `XIcon` component.
import { LoadingSpinnerIcon, CreditCardIcon, PixIcon, MercadoPagoIcon, CopyIcon, CheckIcon, XIcon } from './icons';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Em um ambiente de produção real, esta chave viria de uma variável de ambiente.
// FIX: A chave pública foi trocada por uma chave de TESTE para o Brasil para resolver o erro "Could not fetch site ID".
// A chave anterior era de produção e para uma região diferente, causando o conflito.
const MERCADO_PAGO_PUBLIC_KEY = 'APP_USR-893f2ebf-62c5-4b29-96fc-ade0dfe88dca';

type PaymentMethod = 'card' | 'pix';

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedPackage, setSelectedPackage] = useState({ credits: 50, price: 10.00 });
  const [activeMethod, setActiveMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'error' | null>(null);
  const [pixData, setPixData] = useState<{ qr_code: string; qr_code_base64: string; expiration: number } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  
  const paymentBrickRef = useRef<any>(null);

  const packages = [
    { credits: 10, price: 2.50 },
    { credits: 50, price: 10.00 },
    { credits: 100, price: 18.00 },
  ];

  const resetState = () => {
    setErrorMessage('');
    setSelectedPackage({ credits: 50, price: 10.00 });
    setActiveMethod('card');
    setIsProcessing(false);
    setPaymentStatus(null);
    setPixData(null);
    setIsCopied(false);
    setIsGeneratingPix(false);
  };
  
  const handleClose = () => {
    if (paymentBrickRef.current) {
        paymentBrickRef.current.unmount();
        paymentBrickRef.current = null;
    }
    onClose();
  }

  useEffect(() => {
    if (isOpen) {
        resetState();
    }
  }, [isOpen]);

  // Efeito para inicializar e destruir o Brick de Cartão
  useEffect(() => {
    let isMounted = true;
    if (isOpen && activeMethod === 'card' && !paymentBrickRef.current) {
        const mp = new window.MercadoPago(MERCADO_PAGO_PUBLIC_KEY, {
            locale: 'pt-BR'
        });
        const bricksBuilder = mp.bricks();

        const renderCardBrick = async () => {
            if (!isMounted) return;
            try {
                const brick = await bricksBuilder.create('payment', 'paymentBrick_container', {
                    initialization: {
                        amount: selectedPackage.price,
                        // FIX: Added `entityType: 'individual'` to the payer object to resolve the Mercado Pago brick error.
                        // The error "entityType only receives the value individual or association" was caused by this missing field.
                        payer: { 
                            email: user?.email || '',
                            entityType: 'individual'
                        },
                    },
                    customization: {
                        visual: { style: { theme: 'dark' } },
                        paymentMethods: {
                            creditCard: 'all',
                            debitCard: 'all',
                            ticket: "all",
                            bankTransfer: "all",
                            onboarding_credits: "all",
                            maxInstallments: 1
                        },
                    },
                    callbacks: {
                        onReady: () => console.log('Payment Brick is ready'),
                        onSubmit: async ({ formData }) => {
                            if (!user) return;
                            setIsProcessing(true);
                            setPaymentStatus('pending');
                            setErrorMessage('');
                            try {
                                const response = await paymentService.processCardPayment(formData.token, formData.transaction_amount, user.email);
                                setPaymentStatus(response.status === 'approved' ? 'success' : 'error');
                                if (response.status !== 'approved') {
                                    setErrorMessage(response.message || "Payment was not approved.");
                                }
                            } catch (error) {
                                setPaymentStatus('error');
                                setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred.");
                            } finally {
                                setIsProcessing(false);
                            }
                        },
                        onError: (error: any) => {
                            console.error(error);
                            setErrorMessage('An error occurred with the payment form.');
                        },
                    },
                });
                if (isMounted) {
                    paymentBrickRef.current = brick;
                }
            } catch (error) {
                console.error("Failed to render brick:", error);
                if (isMounted) setErrorMessage("Could not load payment form.");
            }
        };
        renderCardBrick();
    }
    
    return () => {
        isMounted = false;
        if (paymentBrickRef.current) {
            paymentBrickRef.current.unmount();
            paymentBrickRef.current = null;
        }
    };
  }, [isOpen, activeMethod, selectedPackage, user]);

  const handleGeneratePix = async () => {
    if (!user) return;
    setIsGeneratingPix(true);
    setErrorMessage('');
    setPixData(null);
    try {
        const data = await paymentService.createPixPayment(selectedPackage.price.toFixed(2), selectedPackage.credits, user.email);
        setPixData(data);
    } catch(error) {
        setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
        setIsGeneratingPix(false);
    }
  }

  const handleCopyPix = () => {
    if (!pixData) return;
    navigator.clipboard.writeText(pixData.qr_code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  if (!isOpen) return null;
  
  const mainContent = () => {
      if (paymentStatus === 'success') {
          return (
              <div className="p-10 flex flex-col items-center justify-center text-center h-[450px]">
                  <CheckIcon className="w-16 h-16 text-green-400 mb-4" />
                  <h2 className="text-2xl font-bold text-white">Payment Successful!</h2>
                  <p className="text-slate-400 mt-2">Your credits will be added to your account as soon as the payment is confirmed by the network. You can now close this window.</p>
              </div>
          )
      }
      
      return (
          <>
            <div className="p-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white">Buy Credits</h2>
                <p className="text-slate-400 text-sm mt-1">Complete your payment securely with Mercado Pago.</p>
              </div>
              <button onClick={handleClose} className="text-slate-500 hover:text-white transition-colors">
                  <XIcon className="w-6 h-6" />
              </button>
            </div>
             <div className="px-6">
                <div className="grid grid-cols-3 gap-2 bg-slate-900/50 p-1 rounded-lg">
                    {packages.map(pkg => (
                        <button key={pkg.credits} onClick={() => setSelectedPackage(pkg)} className={`p-3 border-2 rounded-lg text-center transition-colors ${selectedPackage.credits === pkg.credits ? 'border-purple-500 bg-purple-900/50' : 'border-slate-700 hover:border-purple-600'}`}>
                            <p className="text-lg font-bold text-amber-400">{pkg.credits}</p>
                            <p className="text-xs text-slate-300">Credits</p>
                            <p className="text-xs text-slate-400 mt-1">${pkg.price.toFixed(2)}</p>
                        </button>
                    ))}
                </div>
            </div>
            <div className="p-6">
                <div className="flex gap-1 bg-slate-700/50 p-1 rounded-lg">
                    <button onClick={() => setActiveMethod('card')} className={`flex-1 py-3 text-sm font-semibold transition-colors rounded-lg flex items-center justify-center gap-2 ${activeMethod === 'card' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}>
                        <CreditCardIcon className="w-5 h-5" />
                        Credit / Debit Card
                    </button>
                    <button onClick={() => setActiveMethod('pix')} className={`flex-1 py-3 text-sm font-semibold transition-colors rounded-lg flex items-center justify-center gap-2 ${activeMethod === 'pix' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}>
                        <PixIcon className="w-5 h-5" />
                        Pix
                    </button>
                </div>
                {activeMethod === 'card' && (
                    <div id="paymentBrick_container" className="mt-4 min-h-[350px]">
                        {/* O Brick do Mercado Pago será renderizado aqui */}
                    </div>
                )}
                {activeMethod === 'pix' && (
                    <div className="mt-4 min-h-[350px] flex flex-col items-center justify-center text-center">
                        {pixData ? (
                            <div className="flex flex-col items-center gap-4">
                                <h3 className="text-lg font-semibold text-white">Scan to Pay with PIX</h3>
                                <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="PIX QR Code" className="w-48 h-48 bg-white p-2 rounded-lg" />
                                <div className="w-full bg-slate-700/50 p-3 rounded-lg flex items-center gap-2">
                                    <input type="text" readOnly value={pixData.qr_code} className="w-full bg-transparent text-slate-300 text-xs font-mono outline-none border-none" />
                                    <button onClick={handleCopyPix} className="px-3 py-1.5 text-sm font-medium bg-slate-600 rounded-md hover:bg-purple-600 transition-colors">
                                        {isCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400">This code expires in 10 minutes. After payment, your credits will be added automatically.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <button
                                    onClick={handleGeneratePix}
                                    disabled={isGeneratingPix}
                                    className="inline-flex items-center justify-center px-6 py-3 font-semibold text-base text-white transition-all duration-200 bg-purple-600 rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-purple-500 disabled:opacity-50"
                                >
                                    {isGeneratingPix ? <LoadingSpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5" /> : null}
                                    Generate PIX Code
                                </button>
                                {errorMessage && <p className="text-red-400 text-sm mt-2">{errorMessage}</p>}
                            </div>
                        )}
                    </div>
                )}
            </div>
          </>
      )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]" onClick={handleClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {isProcessing && (
          <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center z-20">
            <LoadingSpinnerIcon className="w-10 h-10 animate-spin text-purple-400" />
            <p className="mt-4 text-lg font-semibold text-white">
                {paymentStatus === 'success' ? 'Payment Confirmed!' : 'Processing Payment...'}
            </p>
          </div>
        )}
        {mainContent()}
        <footer className="p-4 bg-slate-900/50 flex items-center justify-center gap-2">
            <p className="text-xs text-slate-500">Powered by</p>
            <MercadoPagoIcon className="h-6 w-auto" />
        </footer>
      </div>
    </div>
  );
};

export default PaymentModal;
