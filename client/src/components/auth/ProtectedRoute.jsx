import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
        <p className="text-xs text-slate-400 font-mono">Verifying student session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login while preserving previous attempted path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
