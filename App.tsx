
import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import MainApp from './MainApp';
import Header from './components/Header';

type AppMode = 'influencer' | 'productAd' | 'influencerOnly' | 'imageGenerator' | 'videoGenerator';
type AdminRoute = 'main' | 'admin';

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const [route, setRoute] = React.useState<AdminRoute>('main');
  const [mode, setMode] = React.useState<AppMode>('influencer');

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  const navigate = (newRoute: AdminRoute) => {
    if (user.role === 'admin') {
      setRoute(newRoute);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-4 sm:p-6 md:p-8 font-sans pt-28 sm:pt-24">
      <Header
        currentMode={mode}
        onModeChange={setMode}
        onNavigate={navigate}
        currentRoute={route}
      />
      <div className="w-full max-w-6xl mx-auto">
        {route === 'admin' && user.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <MainApp mode={mode} />
        )}
      </div>
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