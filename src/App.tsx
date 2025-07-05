
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppDataProvider } from '@/contexts/AppDataContext';
import { Layout } from '@/components/Layout';
import { AuthPage } from '@/components/auth/AuthPage';
import { Dashboard } from '@/components/Dashboard';
import { useAuth } from '@/contexts/AuthContext';

const queryClient = new QueryClient();

function AppContent() {
  const { user } = useAuth();
  
  return (
    <Layout>
      {user ? <Dashboard /> : <AuthPage />}
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppDataProvider>
            <AppContent />
          </AppDataProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
