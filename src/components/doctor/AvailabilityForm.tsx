import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Calendar, Clock, Save } from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

interface DaySchedule {
  enabled: boolean;
  timeSlots: { start: string; end: string }[];
}

interface WorkingHours {
  [key: string]: string[];
}

interface AvailabilityData {
  working_hours?: WorkingHours;
}

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const AvailabilityForm = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeDay, setActiveDay] = useState('monday');
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>({
    monday: { enabled: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
    tuesday: { enabled: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
    wednesday: { enabled: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
    thursday: { enabled: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
    friday: { enabled: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
    saturday: { enabled: false, timeSlots: [] },
    sunday: { enabled: false, timeSlots: [] },
  });

  const form = useForm();

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('doctors')
          .select('availability')
          .eq('id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching availability data:', error);
          return;
        }
        
        if (data?.availability) {
          const savedSchedule = { ...schedule };
          const availabilityData = data.availability as AvailabilityData;
          const workingHours = availabilityData.working_hours;
          
          if (workingHours) {
            DAYS_OF_WEEK.forEach(day => {
              if (workingHours[day]) {
                const timeSlots = workingHours[day].map(slot => {
                  const [start, end] = slot.split('-');
                  return { start, end };
                });
                
                savedSchedule[day] = {
                  enabled: timeSlots.length > 0,
                  timeSlots: timeSlots.length > 0 ? timeSlots : [{ start: '09:00', end: '17:00' }]
                };
              }
            });
            
            setSchedule(savedSchedule);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvailability();
  }, [user]);

  const addTimeSlot = (day: string) => {
    const daySchedule = schedule[day];
    const lastSlot = daySchedule.timeSlots[daySchedule.timeSlots.length - 1];
    
    setSchedule({
      ...schedule,
      [day]: {
        ...daySchedule,
        timeSlots: [
          ...daySchedule.timeSlots,
          { start: lastSlot?.end || '09:00', end: lastSlot?.end || '17:00' }
        ]
      }
    });
  };

  const removeTimeSlot = (day: string, index: number) => {
    const daySchedule = schedule[day];
    const newTimeSlots = [...daySchedule.timeSlots];
    newTimeSlots.splice(index, 1);
    
    setSchedule({
      ...schedule,
      [day]: {
        ...daySchedule,
        timeSlots: newTimeSlots
      }
    });
  };

  const updateTimeSlot = (day: string, index: number, field: 'start' | 'end', value: string) => {
    const daySchedule = schedule[day];
    const newTimeSlots = [...daySchedule.timeSlots];
    newTimeSlots[index] = { ...newTimeSlots[index], [field]: value };
    
    setSchedule({
      ...schedule,
      [day]: {
        ...daySchedule,
        timeSlots: newTimeSlots
      }
    });
  };

  const toggleDayEnabled = (day: string, enabled: boolean) => {
    setSchedule({
      ...schedule,
      [day]: {
        ...schedule[day],
        enabled
      }
    });
  };

  const onSubmit = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      const workingHours: WorkingHours = {};
      
      DAYS_OF_WEEK.forEach(day => {
        const daySchedule = schedule[day];
        if (daySchedule.enabled && daySchedule.timeSlots.length > 0) {
          workingHours[day] = daySchedule.timeSlots.map(slot => `${slot.start}-${slot.end}`);
        } else {
          workingHours[day] = [];
        }
      });
      
      const { data: existingDoctor, error: fetchError } = await supabase
        .from('doctors')
        .select('id')
        .eq('id', user.id)
        .single();
      
      let updateError;
      
      if (!existingDoctor && fetchError && fetchError.code === 'PGRST116') {
        const { error } = await supabase
          .from('doctors')
          .insert([{
            id: user.id,
            availability: { working_hours: workingHours },
            specialty: 'General Medicine' // Default specialty
          }]);
          
        updateError = error;
      } else {
        const { error } = await supabase
          .from('doctors')
          .update({
            availability: { working_hours: workingHours }
          })
          .eq('id', user.id);
          
        updateError = error;
      }
      
      if (updateError) throw updateError;
      
      toast({
        title: 'Success',
        description: 'Your availability has been updated.',
      });
      
    } catch (error: any) {
      console.error('Error updating availability:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update availability',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mediblue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <Calendar className="h-5 w-5 text-mediblue-600" />
            Set Your Availability
          </h2>
        </div>
        
        <Form {...form}>
          <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
            <Tabs value={activeDay} onValueChange={setActiveDay}>
              <TabsList className="mb-4">
                {DAYS_OF_WEEK.map((day) => (
                  <TabsTrigger key={day} value={day} className="capitalize">
                    {day.slice(0, 3)}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {DAYS_OF_WEEK.map((day) => (
                <TabsContent key={day} value={day} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium capitalize">{day}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Available</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={schedule[day].enabled} 
                          onChange={(e) => toggleDayEnabled(day, e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mediblue-600"></div>
                      </label>
                    </div>
                  </div>
                  
                  {schedule[day].enabled ? (
                    <div className="space-y-4">
                      {schedule[day].timeSlots.map((slot, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <Input 
                              type="time" 
                              value={slot.start} 
                              onChange={(e) => updateTimeSlot(day, index, 'start', e.target.value)}
                              className="w-32"
                            />
                            <span>to</span>
                            <Input 
                              type="time" 
                              value={slot.end} 
                              onChange={(e) => updateTimeSlot(day, index, 'end', e.target.value)}
                              className="w-32"
                            />
                          </div>
                          
                          {schedule[day].timeSlots.length > 1 && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeTimeSlot(day, index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => addTimeSlot(day)}
                      >
                        Add Time Slot
                      </Button>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      Not available on {day}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
            
            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="flex items-center gap-2">
                {saving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Availability
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AvailabilityForm;
