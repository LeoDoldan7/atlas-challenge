import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import NewSubscription from './pages/NewSubscription';

const App: React.FC = () => {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/subscriptions/new" element={<NewSubscription />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
