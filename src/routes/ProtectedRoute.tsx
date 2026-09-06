import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, UserRole } from '../types';
import Loading from '../components/Loading';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
  canAccess?: (user: User) => boolean;
}

/**
 * ProtectedRoute Component
 *
 * HOW TEAMMATES USE THIS:
 * When adding a new module route, wrap it with ProtectedRoute:
 * <Route
 *   path="/users"
 *   element={
 *     <ProtectedRoute allowedRoles={['System Administrator']}>
 *       <UserList />
 *     </ProtectedRoute>
 *   }
 * />
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, canAccess }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-gray-50)]">
        <Loading message="Verifying session..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (canAccess && !canAccess(user)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
