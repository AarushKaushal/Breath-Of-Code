import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Send from './pages/Send';
import Verify from './pages/Verify';
import Logs from './pages/Logs';
import { Menu } from 'lucide-react';

function AppContent() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-50">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1rem',
          },
        }}
      />

      {!isLanding && (
        <>
          <Sidebar isOpen={isSidebarOpen} toggle={() => setSidebarOpen(!isSidebarOpen)} />
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden fixed top-6 left-6 z-30 p-3 glass rounded-2xl text-slate-400 hover:text-white transition-colors"
          >
            <Menu size={24} />
          </button>
        </>
      )}

      <main className={`flex-1 transition-all duration-300 ${!isLanding ? 'lg:ml-72 p-6 lg:p-12' : ''}`}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/send" element={<Send />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/logs" element={<Logs />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;