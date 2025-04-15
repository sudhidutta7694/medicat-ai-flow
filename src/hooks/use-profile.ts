
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
  const [profileFetched, setProfileFetched] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // First try to get the profile from public.profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        // If user just registered and profile data is missing, we need to ensure
        // that we capture name and email from auth metadata
        if (!data.first_name || !data.last_name) {
          const authUserResponse = await supabase.auth.getUser();
          const authUser = authUserResponse.data.user;
          
          if (authUser) {
            const metadata = authUser.user_metadata;
            const emailData = authUser.email;
            
            // Check if metadata contains name information
            if (metadata && (metadata.name || metadata.full_name || 
                            metadata.first_name || metadata.last_name)) {
              
              const updateData: Record<string, any> = {};
              
              // Handle various metadata formats
              if (metadata.name) {
                const nameParts = metadata.name.split(' ');
                updateData.first_name = nameParts[0];
                updateData.last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
              } else if (metadata.full_name) {
                const nameParts = metadata.full_name.split(' ');
                updateData.first_name = nameParts[0];
                updateData.last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
              } else {
                if (metadata.first_name) updateData.first_name = metadata.first_name;
                if (metadata.last_name) updateData.last_name = metadata.last_name;
              }
              
              // Update email if available
              if (!data.email && emailData) {
                updateData.email = emailData;
              }
              
              // Update profile with this information
              if (Object.keys(updateData).length > 0) {
                const { data: updatedProfile, error: updateError } = await supabase
                  .from('profiles')
                  .update(updateData)
                  .eq('id', user.id)
                  .select()
                  .single();
                  
                if (!updateError && updatedProfile) {
                  setProfile(updatedProfile);
                  setProfileFetched(true);
                  setLoading(false);
                  return;
                }
              }
            }
          }
        }
        
        setProfile(data);
        setProfileFetched(true);
      } catch (error: any) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && !profileFetched) {
      fetchProfile();
    }
  }, [user, profileFetched]);

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
