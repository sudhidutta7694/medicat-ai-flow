
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

const AppointmentPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [userAppointments, setUserAppointments] = useState<any[]>([]);

  const form = useForm({
    defaultValues: {
      doctorId: '',
      date: '',
      time: '09:00',
      issue: '',
      notes: '',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Fetch available doctors
        const { data: doctorsData, error: doctorsError } = await supabase
          .from('doctors')
          .select(`
            id,
            specialty,
            qualification,
            profiles:id (
              first_name,
              last_name
            )
          `);
        
        if (doctorsError) throw doctorsError;
        
        // Transform the data to include full name
        const processedDoctors = doctorsData.map(doctor => ({
          ...doctor,
          fullName: `Dr. ${doctor.profiles.first_name} ${doctor.profiles.last_name} (${doctor.specialty})`
        }));
        
        setDoctors(processedDoctors);
        
        // Fetch user's existing appointments
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select(`
            id,
            scheduled_at,
            status,
            issue,
            doctor_id,
            doctors:doctor_id (
              specialty,
              profiles:id (
                first_name,
                last_name
              )
            )
          `)
          .eq('patient_id', user.id)
          .order('scheduled_at', { ascending: false });
        
        if (appointmentsError) throw appointmentsError;
        setUserAppointments(appointmentsData);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: error.message || 'Could not load appointment data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const onSubmit = async (values: any) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Combine date and time into a single timestamp
      const scheduledAt = new Date(`${values.date}T${values.time}`);
      
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          patient_id: user.id,
          doctor_id: values.doctorId,
          scheduled_at: scheduledAt.toISOString(),
          issue: values.issue,
          notes: values.notes,
          status: 'pending',
        })
        .select();
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Your appointment request has been submitted. You will be notified once it is confirmed.',
      });
      
      // Add the new appointment to the local state
      if (data && data.length > 0) {
        const newAppointment = data[0];
        const selectedDoctor = doctors.find(d => d.id === values.doctorId);
        
        newAppointment.doctors = {
          specialty: selectedDoctor.specialty,
          profiles: {
            first_name: selectedDoctor.profiles.first_name,
            last_name: selectedDoctor.profiles.last_name,
          }
        };
        
        setUserAppointments(prev => [newAppointment, ...prev]);
      }
      
      // Reset the form
      form.reset();
    } catch (error: any) {
      console.error('Error submitting appointment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Could not submit appointment request',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatAppointmentTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mediblue-600"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mediflow-container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Book an Appointment</h1>
          <p className="text-gray-600 mt-1">
            Schedule an appointment with a healthcare professional
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5">
            <Card>
              <CardHeader>
                <CardTitle>Request Appointment</CardTitle>
                <CardDescription>
                  Fill in the details below to request an appointment with a doctor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="doctorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Doctor</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a doctor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {doctors.map(doctor => (
                                <SelectItem key={doctor.id} value={doctor.id}>
                                  {doctor.fullName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="issue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What's the issue?</FormLabel>
                          <FormControl>
                            <Input placeholder="Brief description of your medical issue" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Add any details that might help the doctor" 
                              {...field} 
                              rows={4}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full mt-4" 
                      disabled={submitting}
                    >
                      {submitting ? 'Submitting...' : 'Request Appointment'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-7">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" /> Your Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {userAppointments.map(appointment => (
                      <Card key={appointment.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-gray-500">
                                {formatAppointmentTime(appointment.scheduled_at)}
                              </div>
                              <h4 className="font-semibold">
                                Dr. {appointment.doctors.profiles.first_name} {appointment.doctors.profiles.last_name}
                              </h4>
                              <div className="text-sm">{appointment.doctors.specialty}</div>
                            </div>
                            <div>
                              <span className={`text-xs px-2 py-1 rounded ${getStatusBadgeClass(appointment.status)}`}>
                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                              </span>
                            </div>
                          </div>
                          
                          {appointment.issue && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="text-sm font-medium text-gray-700">Issue:</div>
                              <div className="text-sm text-gray-600">{appointment.issue}</div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">You don't have any appointments yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AppointmentPage;
