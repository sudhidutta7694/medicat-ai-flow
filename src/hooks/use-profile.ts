
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

interface ProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  created_at: string;
  updated_at: string;
  user_type?: string | null;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error: any) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const updateProfile = async (profileData: Partial<Omit<ProfileData, 'id' | 'created_at' | 'updated_at'>>) => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
      
      // Refresh the profile data
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (fetchError) throw fetchError;
      setProfile(data);
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while updating your profile.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Get a profile by ID (useful for doctor looking at patient info)
  const getProfileById = async (profileId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching profile by ID:', error);
      return null;
    }
  };

  // Get patient medical data (for doctors to view)
  const getPatientMedicalData = async (patientId: string) => {
    try {
      // Get patient profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', patientId)
        .single();
        
      if (profileError) throw profileError;
      
      // Get patient medications
      const { data: medications, error: medsError } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', patientId);
        
      if (medsError) throw medsError;
      
      // Get patient conditions
      const { data: conditions, error: condsError } = await supabase
        .from('medical_conditions')
        .select('*')
        .eq('user_id', patientId);
        
      if (condsError) throw condsError;
      
      // Get patient allergies
      const { data: allergies, error: allergiesError } = await supabase
        .from('allergies')
        .select('*')
        .eq('user_id', patientId);
        
      if (allergiesError) throw allergiesError;
      
      return {
        profile: profileData,
        medications: medications || [],
        conditions: conditions || [],
        allergies: allergies || []
      };
    } catch (error: any) {
      console.error('Error fetching patient medical data:', error);
      return null;
    }
  };

  return { profile, loading, updateProfile, getProfileById, getPatientMedicalData };
};
