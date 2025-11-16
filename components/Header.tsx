
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserIcon, LogoutIcon, LogoIcon, MenuIcon, XIcon } from './icons';
import PaymentModal from './PaymentModal';

type AppMode = 'influencer' | 'productAd' | 'influencerOnly' | 'imageGenerator' | 'videoGenerator';
type AdminRoute = 'main' | 'admin';

interface HeaderProps {
    currentMode: AppMode;
    onModeChange: (mode: AppMode) => void;
    currentRoute: AdminRoute;
    onNavigate: (route: AdminRoute) => void;
}

const Header: React.FC<HeaderProps> = ({ currentMode, onModeChange, currentRoute, onNavigate }) => {
  const { user, logout, isAdmin } = useAuth();
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

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

  const navButtonClass = (mode: AppMode) => 
    `cursor-pointer px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
      currentMode === mode && currentRoute === 'main' 
      ? 'bg-purple-600 text-white' 
      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
    }`;
  
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
                    <div className="flex-shrink-0">
                       <LogoIcon className="h-10 w-auto" />
                    </div>
                    <nav className="hidden md:flex items-baseline space-x-4 ml-10">
                        <button onClick={() => handleModeChange('influencer')} className={navButtonClass('influencer')}>
                            Influencer + Product
                        </button>
                        <button onClick={() => handleModeChange('productAd')} className={navButtonClass('productAd')}>
                            Product Ad
                        </button>
                        <button onClick={() => handleModeChange('influencerOnly')} className={navButtonClass('influencerOnly')}>
                            Influencer Only
                        </button>
                        <button onClick={() => handleModeChange('imageGenerator')} className={navButtonClass('imageGenerator')}>
                            Image Generator
                        </button>
                        <button onClick={() => handleModeChange('videoGenerator')} className={navButtonClass('videoGenerator')}>
                            Video Generator
                        </button>
                    </nav>
                </div>

                {/* Desktop User Menu & Admin Nav */}
                <div className="hidden md:flex items-center gap-4">
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
                        onClick={() => setPaymentModalOpen(true)}
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
                    <button onClick={() => handleModeChange('influencer')} className={`${navButtonClass('influencer')} w-full text-left block px-3 py-2 rounded-md text-base font-medium`}>
                        Influencer + Product
                    </button>
                    <button onClick={() => handleModeChange('productAd')} className={`${navButtonClass('productAd')} w-full text-left block px-3 py-2 rounded-md text-base font-medium`}>
                        Product Ad
                    </button>
                    <button onClick={() => handleModeChange('influencerOnly')} className={`${navButtonClass('influencerOnly')} w-full text-left block px-3 py-2 rounded-md text-base font-medium`}>
                        Influencer Only
                    </button>
                    <button onClick={() => handleModeChange('imageGenerator')} className={`${navButtonClass('imageGenerator')} w-full text-left block px-3 py-2 rounded-md text-base font-medium`}>
                        Image Generator
                    </button>
                    <button onClick={() => handleModeChange('videoGenerator')} className={`${navButtonClass('videoGenerator')} w-full text-left block px-3 py-2 rounded-md text-base font-medium`}>
                        Video Generator
                    </button>
                </div>
                <div className="pt-4 pb-3 border-t border-slate-700">
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
                            onClick={() => { setPaymentModalOpen(true); setMobileMenuOpen(false); }}
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
