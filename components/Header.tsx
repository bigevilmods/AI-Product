
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserIcon, LogoutIcon, LogoIcon, MenuIcon, XIcon, ChevronDownIcon } from './icons';
import PaymentModal from './PaymentModal';

type AppMode = 'influencer' | 'productAd' | 'influencerOnly' | 'imageGenerator' | 'videoGenerator';
type AdminRoute = 'main' | 'admin';

interface HeaderProps {
    currentMode: AppMode;
    onModeChange: (mode: AppMode) => void;
    currentRoute: AdminRoute;
    onNavigate: (route: AdminRoute) => void;
    onGoHome: () => void;
    onLoginClick: () => void;
}

// Sub-components for better structure
const NavDropdown: React.FC<{ title: string; children: React.ReactNode; isActive: boolean }> = ({ title, children, isActive }) => (
  <div className="relative dropdown">
    <button className={`inline-flex items-center gap-1 cursor-pointer px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive ? 'bg-purple-600/50 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
      <span>{title}</span>
      <ChevronDownIcon className="w-4 h-4" />
    </button>
    <div className="dropdown-menu absolute hidden mt-2 w-56 origin-top-left rounded-md shadow-lg bg-slate-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
      <div className="py-1">
        {children}
      </div>
    </div>
  </div>
);

const NavAccordion: React.FC<{ title: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void; }> = ({ title, children, isOpen, onToggle }) => (
    <div>
        <button onClick={onToggle} className="w-full flex justify-between items-center text-left block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700">
            <span>{title}</span>
            <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
            <div className="pl-4 pt-1 space-y-1">
                {children}
            </div>
        </div>
    </div>
);


const Header: React.FC<HeaderProps> = ({ currentMode, onModeChange, currentRoute, onNavigate, onGoHome, onLoginClick }) => {
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const handleModeChange = (mode: AppMode) => {
    onModeChange(mode);
    setMobileMenuOpen(false); // Close mobile menu on navigation
  }

  const handleAdminNavigate = (route: AdminRoute) => {
    onNavigate(route);
    setMobileMenuOpen(false); // Close mobile menu on navigation
  }

  const handleLogout = () => {
      logout();
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
  ];
  
  const isPromptGroupActive = promptGenerators.some(p => p.mode === currentMode);
  const isAiGroupActive = aiGenerators.some(a => a.mode === currentMode);

  const adminNavClass = (route: AdminRoute) => 
    `cursor-pointer px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
      currentRoute === route 
      ? 'bg-purple-600 text-white' 
      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
    }`;
    

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full bg-slate-900/80 backdrop-blur-md shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
                {/* Logo and Desktop Main Nav */}
                <div className="flex items-center">
                    <button onClick={onGoHome} className="flex-shrink-0" aria-label="Go to Home page">
                       <LogoIcon className="h-10 w-auto" />
                    </button>
                    <nav className="hidden md:flex items-baseline space-x-1 ml-10">
                      <NavDropdown title="Geradores de Prompt" isActive={isPromptGroupActive}>
                        {promptGenerators.map(({ mode, label }) => (
                          <button
                            key={mode}
                            onClick={() => handleModeChange(mode)}
                            className={`w-full text-left block px-4 py-2 text-sm transition-colors ${currentMode === mode ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                          >
                            {label}
                          </button>
                        ))}
                      </NavDropdown>
                      <NavDropdown title="Geradores de IA" isActive={isAiGroupActive}>
                        {aiGenerators.map(({ mode, label }) => (
                          <button
                            key={mode}
                            onClick={() => handleModeChange(mode)}
                             className={`w-full text-left block px-4 py-2 text-sm transition-colors ${currentMode === mode ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                          >
                            {label}
                          </button>
                        ))}
                      </NavDropdown>
                    </nav>
                </div>

                {/* Desktop User Menu & Admin Nav */}
                <div className="hidden md:flex items-center gap-4">
                    {isAuthenticated && user ? (
                        <>
                            {isAdmin && (
                                <nav className="flex items-center space-x-1 p-1 bg-slate-800 rounded-lg">
                                    <button onClick={() => handleAdminNavigate('main')} className={adminNavClass('main')}>App</button>
                                    <button onClick={() => handleAdminNavigate('admin')} className={adminNavClass('admin')}>Admin</button>
                                </nav>
                            )}
                            <div className="flex items-center gap-2">
                                <UserIcon className="w-5 h-5 text-slate-400" />
                                <span className="text-sm font-medium text-slate-300">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-md">
                                <div className="font-bold text-md text-amber-400">{user.credits}</div>
                                <div className="text-xs text-slate-400">Credits</div>
                            </div>
                            <button
                                onClick={handleBuyCreditsClick}
                                className="px-3 py-2 font-semibold text-sm bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors duration-200"
                            >
                                Buy Credits
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors duration-200"
                                aria-label="Logout"
                            >
                                <LogoutIcon className="w-5 h-5" />
                            </button>
                        </>
                    ) : (
                         <button
                            onClick={onLoginClick}
                            className="px-4 py-2 font-semibold text-sm bg-purple-600 text-white rounded-md hover:bg-purple-500 transition-colors duration-200"
                        >
                            Login / Register
                        </button>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden flex items-center">
                    <button
                        onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                        className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none"
                    >
                        {isMobileMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
                    </button>
                </div>
            </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
            <div className="md:hidden bg-slate-900 border-t border-slate-700">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                  <NavAccordion title="Geradores de Prompt" isOpen={openAccordion === 'prompts'} onToggle={() => toggleAccordion('prompts')}>
                     {promptGenerators.map(({ mode, label }) => (
                          <button key={mode} onClick={() => handleModeChange(mode)} className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${currentMode === mode ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}>
                              {label}
                          </button>
                      ))}
                  </NavAccordion>
                  <NavAccordion title="Geradores de IA" isOpen={openAccordion === 'ai'} onToggle={() => toggleAccordion('ai')}>
                     {aiGenerators.map(({ mode, label }) => (
                          <button key={mode} onClick={() => handleModeChange(mode)} className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${currentMode === mode ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}>
                              {label}
                          </button>
                      ))}
                  </NavAccordion>
                </div>
                <div className="pt-4 pb-3 border-t border-slate-700">
                    {isAuthenticated && user ? (
                        <>
                            <div className="flex items-center px-5">
                                <UserIcon className="w-8 h-8 text-slate-400"/>
                                <div className="ml-3">
                                    <div className="text-base font-medium text-white">{user.email}</div>
                                    <div className="text-sm font-medium text-slate-400">{user.credits} Credits</div>
                                </div>
                            </div>
                            <div className="mt-3 px-2 space-y-1">
                                {isAdmin && (
                                    <>
                                        <button onClick={() => handleAdminNavigate('main')} className={`${adminNavClass('main')} w-full text-left block px-3 py-2 rounded-md text-base font-medium`}>
                                            App
                                        </button>
                                        <button onClick={() => handleAdminNavigate('admin')} className={`${adminNavClass('admin')} w-full text-left block px-3 py-2 rounded-md text-base font-medium`}>
                                            Admin Panel
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={handleBuyCreditsClick}
                                    className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700"
                                >
                                    Buy Credits
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700"
                                >
                                    Logout
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="px-2 space-y-1">
                            <button
                                onClick={() => { onLoginClick(); setMobileMenuOpen(false); }}
                                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700"
                            >
                                Login / Register
                            </button>
                             <button
                                onClick={handleBuyCreditsClick}
                                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700"
                            >
                                Buy Credits
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}
      </header>
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
      />
    </>
  );
};

export default Header;