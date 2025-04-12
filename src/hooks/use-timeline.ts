
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface MedicalEvent {
  id: string;
  user_id: string;
  date: string;
  title: string;
  description: string | null;
  type: 'prescription' | 'lab' | 'visit' | 'medicine' | 'alert';
  related_file_url: string | null;
  created_at: string;
}

export const useTimeline = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<MedicalEvent[]>([]);

  const fetchEvents = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('medical_events')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      
      // Cast the data to ensure it matches the MedicalEvent type
      const typedData = data?.map(event => ({
        ...event,
        type: event.type as 'prescription' | 'lab' | 'visit' | 'medicine' | 'alert'
      })) || [];
      
      setEvents(typedData);
    } catch (error: any) {
      console.error('Error fetching medical events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const addEvent = async (eventData: Omit<MedicalEvent, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('medical_events')
        .insert([
          {
            ...eventData,
            user_id: user.id,
          },
        ]);

      if (error) throw error;
      
      toast({
        title: 'Event added',
        description: 'Medical event has been added successfully.',
      });
      
      // Refresh the list
      fetchEvents();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while adding the event.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (id: string, eventData: Partial<Omit<MedicalEvent, 'id' | 'user_id' | 'created_at'>>) => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('medical_events')
        .update(eventData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: 'Event updated',
        description: 'Medical event has been updated successfully.',
      });
      
      // Refresh the list
      fetchEvents();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while updating the event.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('medical_events')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: 'Event deleted',
        description: 'Medical event has been deleted successfully.',
      });
      
      // Refresh the list
      fetchEvents();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while deleting the event.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return { events, loading, addEvent, updateEvent, deleteEvent };
};
