

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserIcon, LogoutIcon, LogoIcon, MenuIcon, XIcon, ChevronDownIcon, KeyIcon } from './icons';
import PaymentModal from './PaymentModal';
import ApiKeyModal from './ApiKeyModal';
// FIX: To break a circular dependency, the AppView and AppMode types are now imported from a central types file.
import type { AppView, AppMode } from '../types';


interface HeaderProps {
    currentView: AppView;
    onViewChange: (view: AppView) => void;
    onLoginClick: () => void;
}

const NavDropdown: React.FC<{ title: string; children: React.ReactNode; isActive: boolean }> = ({ title, children, isActive }) => (
  <div className="relative group">
    <button className={`inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white ${isActive ? 'bg-purple-600/50 text-white' : ''}`}>
      <span>{title}</span>
      <ChevronDownIcon className="w-4 h-4" />
    </button>
    <div className="absolute hidden group-hover:block mt-2 w-56 origin-top-left rounded-md shadow-lg bg-slate-800 ring-1 ring-black ring-opacity-5 z-10 transition-all duration-300 ease-out opacity-0 -translate-y-2 transform group-hover:opacity-100 group-hover:translate-y-0">
      <div className="py-1">
        {children}
      </div>
    </div>
  </div>
);

const NavAccordion: React.FC<{ title: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void; }> = ({ title, children, isOpen, onToggle }) => (
    <div>
        <button onClick={onToggle} className={`w-full flex justify-between items-center text-left p-3 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700`}>
            <span>{title}</span>
            <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        <div className={`max-h-0 overflow-hidden transition-max-height duration-300 ease-out ${isOpen ? 'max-h-[500px]' : ''}`}>
            <div className="pl-4 pt-1 flex flex-col gap-1">
                {children}
            </div>
        </div>
    </div>
);


const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, onLoginClick }) => {
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isApiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const handleViewChange = (view: AppView) => {
    onViewChange(view);
    setMobileMenuOpen(false);
  }
  
  const handleLogout = () => {
      logout();
      handleViewChange('home');
      setMobileMenuOpen(false);
  }
  
  const handleBuyCreditsClick = () => {
    if (isAuthenticated) {
        setPaymentModalOpen(true);
    } else {
        onLoginClick();
    }
    setMobileMenuOpen(false);
  }
  
  const toggleAccordion = (menu: string) => {
    setOpenAccordion(openAccordion === menu ? null : menu);
  }

  const promptGenerators: { mode: AppMode, label: string }[] = [
    { mode: 'influencer', label: 'Influencer + Product' },
    { mode: 'productAd', label: 'Product Ad' },
    { mode: 'influencerOnly', label: 'Influencer Only' },
  ];

  const aiGenerators: { mode: AppMode, label: string }[] = [
    { mode: 'imageGenerator', label: 'Image Generator' },
    { mode: 'videoGenerator', label: 'Video Generator' },
    { mode: 'storyboardGenerator', label: 'Storyboard Generator' },
    { mode: 'textToSpeechGenerator', label: 'Text-to-Speech' },
  ];
  
  const isPromptGroupActive = promptGenerators.some(p => p.mode === currentView);
  const isAiGroupActive = aiGenerators.some(a => a.mode === currentView);
    
  const NavLink: React.FC<{view: AppView, children: React.ReactNode, isDropdown?: boolean}> = ({ view, children, isDropdown = false }) => (
     <button
        onClick={() => handleViewChange(view)}
        className={isDropdown 
            ? `w-full text-left block px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white ${currentView === view ? 'bg-purple-600 text-white' : ''}`
            : `px-3 py-2 rounded-md text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white ${currentView === view ? 'bg-purple-600 text-white' : ''}`
        }
      >
        {children}
      </button>
  );

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full bg-slate-900/80 backdrop-blur-sm shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
                <div className="flex items-center">
                    <button onClick={() => handleViewChange('home')} className="flex-shrink-0" aria-label="Go to Home page">
                       <LogoIcon className="h-10 w-auto" />
                    </button>
                    <nav className="hidden md:flex items-baseline gap-1 ml-10">
                      <NavDropdown title="Prompt Generators" isActive={isPromptGroupActive}>
                        {promptGenerators.map(({ mode, label }) => (
                          <NavLink key={mode} view={mode} isDropdown>{label}</NavLink>
                        ))}
                      </NavDropdown>
                      <NavDropdown title="AI Generators" isActive={isAiGroupActive}>
                        {aiGenerators.map(({ mode, label }) => (
                          <NavLink key={mode} view={mode} isDropdown>{label}</NavLink>
                        ))}
                      </NavDropdown>
                      {user?.role === 'affiliate' && <NavLink view="affiliate">Affiliate Dashboard</NavLink>}
                    </nav>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    {isAuthenticated && user ? (
                        <>
                            {isAdmin && (
                                <nav className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg">
                                    <NavLink view="home">App</NavLink>
                                    <NavLink view="admin">Admin</NavLink>
                                </nav>
                            )}
                            <div className="flex items-center gap-2">
                                <UserIcon className="w-5 h-5 text-slate-400" />
                                <span className="text-sm font-medium text-slate-300">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-md">
                                <div className="font-bold text-lg text-amber-400">{user.credits}</div>
                                <div className="text-xs text-slate-400">Credits</div>
                            </div>
                            <button
                                onClick={handleBuyCreditsClick}
                                className="px-4 py-2 font-semibold text-sm text-white bg-green-600 rounded-md hover:bg-green-500 transition-colors"
                            >
                                Buy Credits
                            </button>
                             <button
                                onClick={() => setApiKeyModalOpen(true)}
                                className="p-2 text-slate-400 rounded-full hover:text-white hover:bg-slate-700 transition-colors"
                                aria-label="Set API Key"
                            >
                                <KeyIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-slate-400 rounded-full hover:text-white hover:bg-slate-700 transition-colors"
                                aria-label="Logout"
                            >
                                <LogoutIcon className="w-5 h-5" />
                            </button>
                        </>
                    ) : (
                         <button
                            onClick={onLoginClick}
                            className="px-4 py-2 font-semibold text-sm text-white bg-purple-600 rounded-md hover:bg-purple-500 transition-colors"
                        >
                            Login / Register
                        </button>
                    )}
                </div>

                <div className="flex items-center md:hidden">
                    <button
                        onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                        className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700"
                    >
                        {isMobileMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                    </button>
                </div>
            </div>
        </div>

        {isMobileMenuOpen && (
            <div className="md:hidden bg-slate-900 border-t border-slate-700">
                <div className="px-2 pt-2 pb-3 flex flex-col gap-1 sm:px-3">
                  <NavAccordion title="Prompt Generators" isOpen={openAccordion === 'prompts'} onToggle={() => toggleAccordion('prompts')}>
                     {promptGenerators.map(({ mode, label }) => (
                          <button key={mode} onClick={() => handleViewChange(mode)} className={`w-full text-left block p-3 rounded-md text-base font-medium ${currentView === mode ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}>
                              {label}
                          </button>
                      ))}
                  </NavAccordion>
                  <NavAccordion title="AI Generators" isOpen={openAccordion === 'ai'} onToggle={() => toggleAccordion('ai')}>
                     {aiGenerators.map(({ mode, label }) => (
                          <button key={mode} onClick={() => handleViewChange(mode)} className={`w-full text-left block p-3 rounded-md text-base font-medium ${currentView === mode ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}>
                              {label}
                          </button>
                      ))}
                  </NavAccordion>
                   {user?.role === 'affiliate' && <button onClick={() => handleViewChange('affiliate')} className={`w-full text-left block p-3 rounded-md text-base font-medium ${currentView === 'affiliate' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}>Affiliate Dashboard</button>}
                </div>
                <div className="pt-4 pb-3 border-t border-slate-700">
                    {isAuthenticated && user ? (
                        <>
                            <div className="flex items-center px-5">
                                <UserIcon className="w-8 h-8 text-slate-400" />
                                <div className="ml-3">
                                    <div className="text-base font-medium text-white">{user.email}</div>
                                    <div className="text-sm font-medium text-slate-400">{user.credits} Credits</div>
                                </div>
                            </div>
                            <div className="mt-3 px-2 flex flex-col gap-1">
                                {isAdmin && (
                                    <>
                                        <button onClick={() => handleViewChange('home')} className={`w-full text-left block p-3 rounded-md text-base font-medium ${currentView === 'home' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}>
                                            App
                                        </button>
                                        <button onClick={() => handleViewChange('admin')} className={`w-full text-left block p-3 rounded-md text-base font-medium ${currentView === 'admin' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}>
                                            Admin Panel
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={handleBuyCreditsClick}
                                    className="w-full text-left block p-3 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700"
                                >
                                    Buy Credits
                                </button>
                                <button
                                    onClick={() => { setApiKeyModalOpen(true); setMobileMenuOpen(false); }}
                                    className="w-full text-left block p-3 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700"
                                >
                                    Set API Key
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left block p-3 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700"
                                >
                                    Logout
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="px-2 flex flex-col gap-1">
                            <button
                                onClick={() => { onLoginClick(); setMobileMenuOpen(false); }}
                                className="w-full text-left block p-3 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700"
                            >
                                Login / Register
                            </button>
                             <button
                                onClick={handleBuyCreditsClick}
                                className="w-full text-left block p-3 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700"
                            >
                                Buy Credits
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}
      </header>
      {isPaymentModalOpen && <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
      />}
      {isApiKeyModalOpen && <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
      />}
    </>
  );
};

export default Header;