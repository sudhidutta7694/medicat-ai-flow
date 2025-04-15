
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { Calendar, ChevronLeft, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';
import { useTimeline } from '@/hooks/use-timeline';

interface Doctor {
  id: string;
  specialty: string;
  qualification: string | null;
  availability: Json | null;
  created_at: string;
  experience_years: number | null;
  first_name: string | null;
  last_name: string | null;
  fullName: string;
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

// Define appointment creation steps
enum AppointmentStep {
  DESCRIBE_ISSUE = 0,
  CHOOSE_SPECIALTY = 1,
  SELECT_DOCTOR = 2,
  CHOOSE_DATE_TIME = 3,
  CONFIRMATION = 4
}

const AppointmentPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addEvent } = useTimeline();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
  const [userAppointments, setUserAppointments] = useState<Appointment[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<AppointmentStep>(AppointmentStep.DESCRIBE_ISSUE);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendedSpecialty, setRecommendedSpecialty] = useState<string | null>(null);

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
  const issueDescription = form.watch('issue');

  // Fetch doctors and appointments data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        const { data: doctorsData, error: doctorsError } = await supabase
          .from('doctors')
          .select('*');
        
        if (doctorsError) throw doctorsError;
        
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
                fullName: `Dr. Unknown (${doctor.specialty})`
              };
            }
            
            return {
              ...doctor,
              first_name: profileData.first_name,
              last_name: profileData.last_name,
              fullName: `Dr. ${profileData.first_name || ''} ${profileData.last_name || ''} (${doctor.specialty})`
            };
          })
        );
        
        setDoctors(doctorsWithProfiles);
        
        // Extract unique specialties from the doctors data
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

  // Update available time slots when doctor or date changes
  useEffect(() => {
    if (selectedDoctorId && selectedDate) {
      const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
      if (!selectedDoctor || !selectedDoctor.availability) {
        setAvailableTimeSlots(['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']);
        return;
      }

      const dayOfWeek = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      const availability = selectedDoctor.availability as any;
      const workingHours = availability?.working_hours?.[dayOfWeek];
      
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

  // Filter doctors by specialty
  const filteredDoctors = selectedSpecialty === "all" 
    ? doctors
    : doctors.filter(doctor => doctor.specialty === selectedSpecialty);

  // Analyze the issue with AI to recommend a specialty
  const analyzeIssue = async () => {
    if (!issueDescription.trim()) {
      toast({
        title: 'Description Required',
        description: 'Please describe your health issue before proceeding.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Call the AI function to analyze the issue and suggest a specialty
      const response = await supabase.functions.invoke('ai-chat', {
        body: {
          message: `Based on the following health issue, recommend a single most appropriate medical specialty that should handle this case. Only respond with the specialty name, nothing else: "${issueDescription}"`,
          doctorMode: true
        }
      });

      if (response.error) {
        throw new Error(response.error);
      }
      
      // Get the recommended specialty
      let suggestedSpecialty = response.data.content.trim();
      
      // Clean up response to just get the specialty name
      suggestedSpecialty = suggestedSpecialty
        .replace(/^.*:/, '')
        .replace(/[."]/g, '')
        .trim();
        
      // Check if the suggested specialty exists in our specialties list
      const matchingSpecialty = specialties.find(
        spec => spec.toLowerCase() === suggestedSpecialty.toLowerCase()
      );
      
      if (matchingSpecialty) {
        setSelectedSpecialty(matchingSpecialty);
        setRecommendedSpecialty(matchingSpecialty);
      } else {
        setSelectedSpecialty("all");
        setRecommendedSpecialty(null);
        toast({
          title: 'No Match Found',
          description: 'Could not match your condition to a specific specialty. Showing all available doctors.',
        });
      }
      
      // Move to the next step
      setCurrentStep(AppointmentStep.CHOOSE_SPECIALTY);
    } catch (error: any) {
      console.error('Error analyzing issue:', error);
      toast({
        title: 'Analysis Error',
        description: 'Could not analyze your health issue. Please try selecting a specialty manually.',
        variant: 'destructive',
      });
      // Still advance to next step despite error
      setCurrentStep(AppointmentStep.CHOOSE_SPECIALTY);
    } finally {
      setIsAnalyzing(false);
    }
  };

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
      
      // Reset the form and step
      form.reset();
      setCurrentStep(AppointmentStep.DESCRIBE_ISSUE);
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

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToNextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  // Render the step content based on the current step
  const renderStepContent = () => {
    switch (currentStep) {
      case AppointmentStep.DESCRIBE_ISSUE:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Describe Your Health Issue</h3>
            <p className="text-gray-500 text-sm">
              Please describe your health concern or symptoms in detail. This will help us match you with the right specialist.
            </p>
            
            <FormField
              control={form.control}
              name="issue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What's troubling you?</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your symptoms or health concern in detail..." 
                      {...field} 
                      rows={5}
                      className="resize-none"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any additional details, medical history, etc." 
                      {...field} 
                      rows={3}
                      className="resize-none"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <Button 
              onClick={analyzeIssue} 
              className="w-full" 
              disabled={isAnalyzing || !form.watch('issue')}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing your issue...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        );
        
      case AppointmentStep.CHOOSE_SPECIALTY:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Select Medical Specialty</h3>
            
            {recommendedSpecialty && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                <p className="text-sm text-blue-700">
                  Based on your description, we recommend a <span className="font-semibold">{recommendedSpecialty}</span> specialist.
                </p>
              </div>
            )}
            
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
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={goBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button onClick={goToNextStep} disabled={filteredDoctors.length === 0}>
                Continue
              </Button>
            </div>
          </div>
        );
        
      case AppointmentStep.SELECT_DOCTOR:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Select a Doctor</h3>
            
            <div className="space-y-3">
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map(doctor => (
                  <div 
                    key={doctor.id} 
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${
                      selectedDoctorId === doctor.id 
                        ? 'border-mediblue-500 bg-mediblue-50' 
                        : 'border-gray-200 hover:border-mediblue-300 hover:bg-gray-50'
                    }`}
                    onClick={() => form.setValue('doctorId', doctor.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Dr. {doctor.first_name} {doctor.last_name}</p>
                        <p className="text-sm text-gray-600">{doctor.specialty}</p>
                        {doctor.qualification && (
                          <p className="text-xs text-gray-500 mt-1">{doctor.qualification}</p>
                        )}
                        {doctor.experience_years && (
                          <p className="text-xs text-gray-500">{doctor.experience_years} years of experience</p>
                        )}
                      </div>
                      <div className="w-4 h-4 rounded-full border border-mediblue-500 flex-shrink-0">
                        {selectedDoctorId === doctor.id && <div className="w-2 h-2 bg-mediblue-500 rounded-full m-auto" />}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">No doctors available for this specialty</p>
                  <Button variant="link" onClick={() => setSelectedSpecialty('all')}>
                    View all doctors
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={goBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button onClick={goToNextStep} disabled={!selectedDoctorId}>
                Continue
              </Button>
            </div>
          </div>
        );
        
      case AppointmentStep.CHOOSE_DATE_TIME:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Choose Date & Time</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="date" 
                          {...field}
                          min={new Date().toISOString().split('T')[0]}
                        />
                        <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
                      </div>
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
            
            {selectedDoctorId && selectedDate && (
              <div className="mt-2">
                <h4 className="text-sm font-medium">Doctor's Availability</h4>
                <div className="mt-1 text-sm text-gray-600">
                  {availableTimeSlots[0] === 'Not available on this day' ? (
                    <p className="text-amber-600">The doctor is not available on this day. Please select another date.</p>
                  ) : (
                    <p>Available times: {availableTimeSlots.join(', ')}</p>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={goBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button onClick={goToNextStep} disabled={!selectedDate || !form.watch('time')}>
                Review & Submit
              </Button>
            </div>
          </div>
        );
        
      case AppointmentStep.CONFIRMATION:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Review & Confirm</h3>
            
            <div className="space-y-3 bg-gray-50 p-4 rounded-md">
              <div>
                <p className="text-sm font-medium text-gray-500">Issue</p>
                <p>{form.watch('issue')}</p>
              </div>
              
              {form.watch('notes') && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Additional Notes</p>
                  <p>{form.watch('notes')}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm font-medium text-gray-500">Doctor</p>
                <p>{doctors.find(d => d.id === selectedDoctorId)?.fullName}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Date & Time</p>
                <p>{new Date(`${selectedDate}T${form.watch('time')}`).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric'
                })} at {form.watch('time')}</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-500">
              By confirming, you agree to the appointment policies. You will receive a notification when the doctor confirms your appointment.
            </p>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={goBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button 
                onClick={form.handleSubmit(onSubmit)} 
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Confirm Appointment'}
              </Button>
            </div>
          </div>
        );
        
      default:
        return null;
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
                  Follow the steps below to request an appointment with a doctor
                </CardDescription>
                <div className="flex justify-between text-sm mt-4">
                  <div className={`flex flex-col items-center ${currentStep >= 0 ? 'text-mediblue-600' : 'text-gray-400'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 0 ? 'bg-mediblue-100 text-mediblue-600' : 'bg-gray-100 text-gray-400'}`}>1</div>
                    <span className="mt-1">Describe</span>
                  </div>
                  <div className={`flex flex-col items-center ${currentStep >= 1 ? 'text-mediblue-600' : 'text-gray-400'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-mediblue-100 text-mediblue-600' : 'bg-gray-100 text-gray-400'}`}>2</div>
                    <span className="mt-1">Specialty</span>
                  </div>
                  <div className={`flex flex-col items-center ${currentStep >= 2 ? 'text-mediblue-600' : 'text-gray-400'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-mediblue-100 text-mediblue-600' : 'bg-gray-100 text-gray-400'}`}>3</div>
                    <span className="mt-1">Doctor</span>
                  </div>
                  <div className={`flex flex-col items-center ${currentStep >= 3 ? 'text-mediblue-600' : 'text-gray-400'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-mediblue-100 text-mediblue-600' : 'bg-gray-100 text-gray-400'}`}>4</div>
                    <span className="mt-1">Schedule</span>
                  </div>
                  <div className={`flex flex-col items-center ${currentStep >= 4 ? 'text-mediblue-600' : 'text-gray-400'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 4 ? 'bg-mediblue-100 text-mediblue-600' : 'bg-gray-100 text-gray-400'}`}>5</div>
                    <span className="mt-1">Confirm</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  {renderStepContent()}
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
