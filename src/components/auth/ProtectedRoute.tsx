
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  doctorOnly?: boolean;
  patientOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  doctorOnly = false, 
  patientOnly = false 
}) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  const [isDoctor, setIsDoctor] = React.useState<boolean | null>(null);
  const [checkingRole, setCheckingRole] = React.useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setCheckingRole(false);
        return;
      }

      try {
        // Query the profiles table to get the user_type
        const { data, error } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking user role:', error);
          setIsDoctor(false);
        } else {
          setIsDoctor(data.user_type === 'doctor');
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setIsDoctor(false);
      } finally {
        setCheckingRole(false);
      }
    };

    if (isAuthenticated && user) {
      checkUserRole();
    } else {
      setCheckingRole(false);
    }
  }, [user, isAuthenticated]);

  if (loading || checkingRole) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mediblue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  // Role-based access control
  if (doctorOnly && !isDoctor) {
    return <Navigate to="/" replace />;
  }

  if (patientOnly && isDoctor) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
