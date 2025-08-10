import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { Toaster } from 'react-hot-toast';
import { apolloClient } from './lib/apollo-client';
import Subscriptions from './pages/Subscriptions';
import NewSubscription from './pages/NewSubscription';
import SubscriptionDetails from './pages/SubscriptionDetails';
import Dashboard from './pages/Dashboard';

const App: React.FC = () => {
  return (
    <ApolloProvider client={apolloClient}>
      <Router>
        <div>
          <Routes>
            <Route path="/" element={<Navigate to="/subscriptions" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/subscriptions/new" element={<NewSubscription />} />
            <Route path="/subscriptions/:id" element={<SubscriptionDetails />} />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </ApolloProvider>
  );
};

export default App;
