import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './lib/apollo-client';
import Home from './pages/Home';
import NewSubscription from './pages/NewSubscription';

const App: React.FC = () => {
  return (
    <ApolloProvider client={apolloClient}>
      <Router>
        <div>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/subscriptions/new" element={<NewSubscription />} />
          </Routes>
        </div>
      </Router>
    </ApolloProvider>
  );
};

export default App;
