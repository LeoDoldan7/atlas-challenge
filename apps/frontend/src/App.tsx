import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './lib/apollo-client';
import Subscriptions from './pages/Subscriptions';
import NewSubscription from './pages/NewSubscription';
import SubscriptionDetails from './pages/SubscriptionDetails';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import EmployeeDetails from './pages/EmployeeDetails';
import Navbar from './components/Navbar';

const App: React.FC = () => {
  return (
    <ApolloProvider client={apolloClient}>
      <Router>
        <div>
          <Navbar />
          <Routes>
            <Route path="/" element={<Navigate to="/subscriptions" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/subscriptions/new" element={<NewSubscription />} />
            <Route path="/subscriptions/:id" element={<SubscriptionDetails />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/employees/:id" element={<EmployeeDetails />} />
          </Routes>
        </div>
      </Router>
    </ApolloProvider>
  );
};

export default App;
