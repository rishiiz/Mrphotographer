import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageSkeleton } from './Skeleton';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If not authorized for this dashboard, redirect to their home dashboard
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'photographer') return <Navigate to="/photographer-dashboard" replace />;
    return <Navigate to="/client-dashboard" replace />;
  }

  return children;
}
