
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

// Define types for clarity
interface Doctor {
  id: string;
  specialty: string;
  qualification: string | null;
  working_hours: Record<string, string[]> | null;
  education: string[] | null;
  certifications: string[] | null;
  first_name: string | null;
  last_name: string | null;
  fullName: string;
  created_at: string;
  experience_years: number | null;
  availability: Json | null;
}

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  issue: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  doctorInfo: {
    specialty: string;
    first_name: string | null;
    last_name: string | null;
  };
}

const AppointmentPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
  const [userAppointments, setUserAppointments] = useState<Appointment[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  const form = useForm({
    defaultValues: {
      doctorId: '',
      date: '',
      time: '',
      issue: '',
      notes: '',
    },
  });

  const selectedDate = form.watch('date');
  const selectedDoctorId = form.watch('doctorId');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // First fetch doctors data
        const { data: doctorsData, error: doctorsError } = await supabase
          .from('doctors')
          .select('*');
        
        if (doctorsError) throw doctorsError;
        
        // Then fetch profiles data for each doctor
        const doctorsWithProfiles = await Promise.all(
          doctorsData.map(async (doctor) => {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', doctor.id)
              .single();
            
            if (profileError) {
              console.error('Error fetching doctor profile:', profileError);
              return {
                ...doctor,
                first_name: 'Unknown',
                last_name: '',
                fullName: `Dr. Unknown (${doctor.specialty})`,
                working_hours: doctor.working_hours || null,
                education: doctor.education || null,
                certifications: doctor.certifications || null,
              };
            }
            
            return {
              ...doctor,
              first_name: profileData.first_name,
              last_name: profileData.last_name,
              fullName: `Dr. ${profileData.first_name || 'Unknown'} ${profileData.last_name || ''} (${doctor.specialty})`,
              working_hours: doctor.working_hours || null,
              education: doctor.education || null,
              certifications: doctor.certifications || null,
            };
          })
        );
        
        setDoctors(doctorsWithProfiles as Doctor[]);
        
        const uniqueSpecialties = [...new Set(doctorsWithProfiles.map((doctor) => doctor.specialty))];
        setSpecialties(uniqueSpecialties);
        
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', user.id)
          .order('scheduled_at', { ascending: false });
        
        if (appointmentsError) throw appointmentsError;
        
        const appointmentsWithDoctors = await Promise.all(
          appointmentsData.map(async (appointment) => {
            const { data: doctorData, error: doctorError } = await supabase
              .from('doctors')
              .select('specialty')
              .eq('id', appointment.doctor_id)
              .single();
            
            if (doctorError) {
              console.error('Error fetching doctor specialty:', doctorError);
              return {
                ...appointment,
                doctorInfo: { specialty: 'Unknown', first_name: 'Unknown', last_name: 'Unknown' }
              };
            }
            
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', appointment.doctor_id)
              .single();
            
            if (profileError) {
              console.error('Error fetching doctor profile:', profileError);
              return {
                ...appointment,
                doctorInfo: { ...doctorData, first_name: 'Unknown', last_name: 'Unknown' }
              };
            }
            
            return {
              ...appointment,
              doctorInfo: { ...doctorData, ...profileData }
            };
          })
        );
        
        setUserAppointments(appointmentsWithDoctors);
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

  useEffect(() => {
    if (selectedDoctorId && selectedDate) {
      const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
      if (!selectedDoctor || !selectedDoctor.working_hours) {
        setAvailableTimeSlots(['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']);
        return;
      }

      const dayOfWeek = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const workingHours = selectedDoctor.working_hours[dayOfWeek];
      
      if (!workingHours || workingHours.length === 0) {
        setAvailableTimeSlots(['Not available on this day']);
        return;
      }

      const slots = [];
      for (const hourRange of workingHours) {
        const [start, end] = hourRange.split('-');
        const startHour = parseInt(start.split(':')[0]);
        const endHour = parseInt(end.split(':')[0]);
        
        for (let hour = startHour; hour < endHour; hour++) {
          slots.push(`${hour.toString().padStart(2, '0')}:00`);
        }
      }
      
      setAvailableTimeSlots(slots.length > 0 ? slots : ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']);
    }
  }, [selectedDoctorId, selectedDate, doctors]);

  const filteredDoctors = selectedSpecialty === "all" 
    ? doctors
    : doctors.filter(doctor => doctor.specialty === selectedSpecialty);

  const onSubmit = async (values: any) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    try {
      setSubmitting(true);
      
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
      
      if (data && data.length > 0) {
        const newAppointment = data[0];
        const selectedDoctor = doctors.find(d => d.id === values.doctorId);
        
        const appointmentWithDoctorInfo = {
          ...newAppointment,
          doctorInfo: {
            specialty: selectedDoctor?.specialty || 'Unknown',
            first_name: selectedDoctor?.first_name || 'Unknown',
            last_name: selectedDoctor?.last_name || 'Unknown'
          }
        };
        
        setUserAppointments(prev => [appointmentWithDoctorInfo, ...prev]);
      }
      
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
                    <div className="mb-4">
                      <FormLabel>Select Specialty</FormLabel>
                      <Select 
                        value={selectedSpecialty} 
                        onValueChange={setSelectedSpecialty}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Specialties" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Specialties</SelectItem>
                          {specialties.map(specialty => (
                            <SelectItem key={specialty} value={specialty}>
                              {specialty}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
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
                              {filteredDoctors.length > 0 ? (
                                filteredDoctors.map(doctor => (
                                  <SelectItem key={doctor.id} value={doctor.id}>
                                    {doctor.fullName}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-doctors" disabled>
                                  No doctors available for this specialty
                                </SelectItem>
                              )}
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
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                              disabled={!selectedDoctorId || !selectedDate || availableTimeSlots[0] === 'Not available on this day'}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableTimeSlots[0] === 'Not available on this day' ? (
                                  <SelectItem value="not-available" disabled>Doctor not available on this day</SelectItem>
                                ) : (
                                  availableTimeSlots.map(slot => (
                                    <SelectItem key={slot} value={slot}>
                                      {slot}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
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
                      disabled={submitting || !form.watch('doctorId') || !form.watch('date') || !form.watch('time')}
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
                                Dr. {appointment.doctorInfo.first_name} {appointment.doctorInfo.last_name}
                              </h4>
                              <div className="text-sm">{appointment.doctorInfo.specialty}</div>
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
