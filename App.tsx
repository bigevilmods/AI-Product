
import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import MainApp from './MainApp';
import Header from './components/Header';
import HomePage from './pages/HomePage';

type AppMode = 'influencer' | 'productAd' | 'influencerOnly' | 'imageGenerator' | 'videoGenerator';
type AppView = 'home' | AppMode;
type AdminRoute = 'main' | 'admin';

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const [route, setRoute] = React.useState<AdminRoute>('main');
  const [view, setView] = React.useState<AppView>('home');
  const [isLoginOpen, setIsLoginOpen] = React.useState(false);

  const navigate = (newRoute: AdminRoute) => {
    if (user?.role === 'admin') {
      setRoute(newRoute);
    }
  };
  
  const requestLogin = () => setIsLoginOpen(true);

  const mainContentPadding = view === 'home' ? 'pt-20' : 'pt-28 sm:pt-24';

  return (
    <div className={`min-h-screen bg-slate-900 text-white flex flex-col items-center p-4 sm:p-6 md:p-8 font-sans ${mainContentPadding}`}>
      <Header
        currentMode={view as AppMode}
        onModeChange={setView}
        onNavigate={navigate}
        currentRoute={route}
        onGoHome={() => setView('home')}
        onLoginClick={requestLogin}
      />
      <div className="w-full max-w-6xl mx-auto z-10">
        {route === 'admin' && user?.role === 'admin' ? (
          <AdminDashboard />
        ) : view === 'home' ? (
          <HomePage navigateTo={setView} />
        ) : (
          <MainApp mode={view} requestLogin={requestLogin} />
        )}
      </div>
      {isLoginOpen && <LoginPage onClose={() => setIsLoginOpen(false)} />}
    </div>
  );
}

// FIX: The AuthProvider component requires a `children` prop. By nesting AppContent within it, we provide the necessary children and resolve the TypeScript error.
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
