
import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import MainApp from './MainApp';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import NotificationBanner from './components/NotificationBanner';
import AffiliateDashboard from './pages/AffiliateDashboard';

export type AppView = 'home' | 'influencer' | 'productAd' | 'influencerOnly' | 'imageGenerator' | 'videoGenerator' | 'admin' | 'affiliate';
export type AppMode = 'influencer' | 'productAd' | 'influencerOnly' | 'imageGenerator' | 'videoGenerator';


function AppContent() {
  const { user } = useAuth();
  const [view, setView] = React.useState<AppView>('home');
  const [isLoginOpen, setIsLoginOpen] = React.useState(false);

  // Capture referral code from URL on initial load
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      sessionStorage.setItem('referralCode', refCode);
      // Optional: remove the query param from URL to clean it up
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const requestLogin = () => setIsLoginOpen(true);

  const mainContentPadding = view === 'home' ? 'pt-20' : 'pt-28 sm:pt-24';
  
  const renderView = () => {
    switch(view) {
      case 'home': 
        return <HomePage navigateTo={setView} />;
      case 'admin': 
        return user?.role === 'admin' ? <AdminDashboard /> : <HomePage navigateTo={setView} />;
      case 'affiliate': 
        return user?.role === 'affiliate' ? <AffiliateDashboard /> : <HomePage navigateTo={setView} />;
      default: 
        return <MainApp mode={view} requestLogin={requestLogin} />;
    }
  }

  return (
    <div className={`min-h-screen bg-slate-900 text-white flex flex-col items-center p-4 sm:p-6 md:p-8 font-sans ${mainContentPadding}`}>
      <Header
        currentView={view}
        onViewChange={setView}
        onLoginClick={requestLogin}
      />
      <div className="w-full max-w-6xl mx-auto z-10">
        <NotificationBanner />
        {renderView()}
      </div>
      {isLoginOpen && <LoginPage onClose={() => setIsLoginOpen(false)} />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;