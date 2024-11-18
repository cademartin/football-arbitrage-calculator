import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Navigation } from './components/Navigation';
import { LiveArbitrage } from './pages/LiveArbitrage';
import { UpcomingArbitrage } from './pages/UpcomingArbitrage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ManualCalculator } from './pages/ManualCalculator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = React.useState<'upcoming' | 'live' | 'calculator'>('upcoming');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="container mx-auto px-4 py-8">
        {currentPage === 'upcoming' ? (
          <UpcomingArbitrage />
        ) : currentPage === 'live' ? (
          <LiveArbitrage />
        ) : (
          <ManualCalculator />
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;