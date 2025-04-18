
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData?: { firstName?: string; lastName?: string; userType?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  userProfile: any;
  isDoctor: boolean;
}

const AuthContext = createContext<AuthContextProps>({
  session: null,
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  isAuthenticated: false,
  userProfile: null,
  isDoctor: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isDoctor, setIsDoctor] = useState<boolean>(false);
  const navigate = useNavigate();

  // Fetch user profile when user changes
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setUserProfile(null);
        setIsDoctor(false);
        return;
      }
      
      try {
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          return;
        }
        
        setUserProfile(profile);
        
        // Check if user is a doctor
        if (profile.user_type === 'doctor') {
          setIsDoctor(true);
          
          // Pre-fetch doctor details if needed
          const { data: doctor } = await supabase
            .from('doctors')
            .select(`
              specialty,
              qualification,
              working_hours,
              education,
              certifications
            `)
            .eq('id', user.id)
            .single();
            
          // Extend profile with doctor details
          if (doctor) {
            setUserProfile((prev: any) => ({ ...prev, doctorDetails: doctor }));
          }
        } else {
          setIsDoctor(false);
        }
      } catch (error) {
        console.error('Error processing user data:', error);
      }
    };

    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    // First set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({
        title: "Welcome back!",
        description: "You've been successfully logged in.",
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "An error occurred during login.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData?: { firstName?: string; lastName?: string; userType?: string }) => {
    try {
      setLoading(true);
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData?.firstName || '',
            last_name: userData?.lastName || '',
            user_type: userData?.userType || 'patient',
          },
        },
      });
      if (error) throw error;
      
      if (data.user && userData?.userType === 'doctor') {
        try {
          // First update the profile
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ user_type: 'doctor' })
            .eq('id', data.user.id);
            
          if (profileError) {
            console.error("Error updating profile type:", profileError);
          }
          
          // Then create the doctor record
          const { error: doctorError } = await supabase
            .from('doctors')
            .insert({
              id: data.user.id,
              specialty: 'General Medicine', // Default value
              qualification: 'MD',
              education: ['Medical School'],
              certifications: ['Board Certified'],
              created_at: new Date().toISOString(),
            });
            
          if (doctorError) {
            console.error("Error creating doctor record:", doctorError);
          }
        } catch (err) {
          console.error("Error in doctor creation process:", err);
        }
      }
      
      toast({
        title: "Account created!",
        description: "Your account has been created successfully.",
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during logout.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!user,
        userProfile,
        isDoctor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
