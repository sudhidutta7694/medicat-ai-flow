import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import MainLayout from '@/components/layout/MainLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import MedicationCard from '@/components/profile/MedicationCard';
import { useProfile } from '@/hooks/use-profile';
import { useMedications } from '@/hooks/use-medications';
import { useMedicalConditions } from '@/hooks/use-medical-conditions';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import PatientReports from '@/components/patient/PatientReports';
import { User, FilePlus, Pill, Bell, Calendar, Clock, Plus } from 'lucide-react';
import SpecialtiesForm from '@/components/doctor/SpecialtiesForm';
import CredentialsForm from '@/components/doctor/CredentialsForm';
import AvailabilityForm from '@/components/doctor/AvailabilityForm';

const ProfilePage = () => {
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { medications, loading: medicationsLoading, addMedication } = useMedications();
  const { user, isDoctor } = useAuth();

  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [email, setEmail] = useState(profile?.email || user?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState(profile?.date_of_birth || '');
  const [gender, setGender] = useState(profile?.gender || '');
  const [conditions, setConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  
  const medicationForm = useForm({
    defaultValues: {
      name: '',
      dosage: '',
      frequency: '',
      startDate: '',
      endDate: '',
      instructions: '',
    }
  });

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setEmail(profile.email || user?.email || '');
      setPhone(profile.phone || '');
      setDateOfBirth(profile.date_of_birth || '');
      setGender(profile.gender || '');
    }
  }, [profile, user]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      date_of_birth: dateOfBirth,
      gender,
    });
  };
  
  const handleAddMedication = (data: any) => {
    addMedication({
      name: data.name,
      dosage: data.dosage,
      frequency: data.frequency,
      start_date: data.startDate,
      end_date: data.endDate || null,
      instructions: data.instructions,
      is_active: true,
    });
  };

  return (
    <MainLayout>
      <div className="mediflow-container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Health Profile</h1>
          <p className="text-gray-600 mt-1">
            Manage your personal information, medications, and medical history
          </p>
        </div>

        {medications && medications.length > 0 && medications.some(med => med.is_active && new Date(med.end_date || '') <= new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000)) && (
          <div className="bg-medired-50 border-l-4 border-medired-500 p-4 mb-6 rounded-md">
            <div className="flex items-center">
              <Bell className="h-5 w-5 mr-2 text-medired-600" />
              <h3 className="font-semibold">Medication Alert</h3>
            </div>
            <p>You have medications that need refilling soon. Check your active medications.</p>
          </div>
        )}

        <Tabs defaultValue="personal">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="personal">
              <User className="h-4 w-4 mr-2" /> Personal Info
            </TabsTrigger>
            {!isDoctor && (
              <>
                <TabsTrigger value="medications">
                  <Pill className="h-4 w-4 mr-2" /> Medications
                </TabsTrigger>
                <TabsTrigger value="records">
                  <FilePlus className="h-4 w-4 mr-2" /> Medical Records
                </TabsTrigger>
                <TabsTrigger value="reports">
                  <FilePlus className="h-4 w-4 mr-2" /> Reports
                </TabsTrigger>
              </>
            )}
            {isDoctor && (
              <>
                <TabsTrigger value="specialties">
                  <FilePlus className="h-4 w-4 mr-2" /> Specialties
                </TabsTrigger>
                <TabsTrigger value="availability">
                  <Calendar className="h-4 w-4 mr-2" /> Availability
                </TabsTrigger>
                <TabsTrigger value="credentials">
                  <FilePlus className="h-4 w-4 mr-2" /> Credentials
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardContent className="pt-6">
                {profileLoading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mediblue-600"></div>
                  </div>
                ) : (
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</label>
                        <Input 
                          id="firstName" 
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</label>
                        <Input 
                          id="lastName" 
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                        <Input 
                          id="email" 
                          type="email" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</label>
                        <Input 
                          id="phone" 
                          type="tel" 
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="dob" className="text-sm font-medium text-gray-700">Date of Birth</label>
                        <Input 
                          id="dob" 
                          type="date" 
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="gender" className="text-sm font-medium text-gray-700">Gender</label>
                        <select 
                          id="gender" 
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>

                    {!isDoctor && (
                      <>
                        <div className="space-y-2">
                          <h3 className="text-md font-medium text-gray-900">Medical Information</h3>
                          <div className="medical-info">
                            <p className="text-sm">
                              This information is critical for your healthcare providers. Please ensure it's accurate and up-to-date.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="conditions" className="text-sm font-medium text-gray-700">Existing Conditions</label>
                          <Textarea 
                            id="conditions" 
                            value={conditions}
                            onChange={(e) => setConditions(e.target.value)}
                            placeholder="Type 2 Diabetes (diagnosed 2018), Hypertension (diagnosed 2015)"
                          />
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="allergies" className="text-sm font-medium text-gray-700">Allergies</label>
                          <Textarea 
                            id="allergies" 
                            value={allergies}
                            onChange={(e) => setAllergies(e.target.value)}
                            placeholder="Penicillin, Sulfa drugs"
                          />
                        </div>
                      </>
                    )}

                    <div className="flex justify-end">
                      <Button type="submit">Save Profile</Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {!isDoctor && (
            <TabsContent value="medications">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium">Current and Past Medications</h2>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" /> Add Medication
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Add New Medication</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <Form {...medicationForm}>
                            <form onSubmit={medicationForm.handleSubmit(handleAddMedication)} className="space-y-4">
                              <FormField
                                control={medicationForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Medication Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter medication name" {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={medicationForm.control}
                                name="dosage"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Dosage</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g. 10mg, 500mg" {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={medicationForm.control}
                                  name="startDate"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Start Date</FormLabel>
                                      <FormControl>
                                        <Input type="date" {...field} />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={medicationForm.control}
                                  name="endDate"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>End Date (if applicable)</FormLabel>
                                      <FormControl>
                                        <Input type="date" {...field} />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <FormField
                                control={medicationForm.control}
                                name="frequency"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Frequency</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g. Once daily, Twice daily with meals" {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={medicationForm.control}
                                name="instructions"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Instructions</FormLabel>
                                    <FormControl>
                                      <Textarea placeholder="Additional instructions or notes" {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <div className="flex justify-end">
                                <Button type="submit">Add Medication</Button>
                              </div>
                            </form>
                          </Form>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {medicationsLoading ? (
                    <div className="flex justify-center py-10">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mediblue-600"></div>
                    </div>
                  ) : medications && medications.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {medications.map((medication) => (
                        <MedicationCard 
                          key={medication.id} 
                          medication={{
                            id: medication.id,
                            name: medication.name,
                            dosage: medication.dosage || '',
                            frequency: medication.frequency || '',
                            startDate: medication.start_date || '',
                            endDate: medication.end_date || undefined,
                            instructions: medication.instructions || '',
                            isActive: medication.is_active,
                          }} 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-blue-50 p-6 rounded-md mt-4 text-center">
                      <p className="text-gray-600">You don't have any medications recorded yet.</p>
                      <Button className="mt-2" variant="outline">Add Your First Medication</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {!isDoctor && (
            <TabsContent value="records">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium">Medical Records</h2>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" /> Upload Record
                    </Button>
                  </div>
                  <p className="text-gray-600 mb-4">
                    You can view and download your medical records here. Records are encrypted and HIPAA-compliant.
                  </p>
                  <div className="bg-blue-50 p-6 rounded-md mt-4 text-center">
                    <p className="text-gray-600">No medical records have been uploaded yet.</p>
                    <Button className="mt-2" variant="outline">Upload Your First Record</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {!isDoctor && (
            <TabsContent value="reports">
              <PatientReports />
            </TabsContent>
          )}

          {isDoctor && (
            <>
              <TabsContent value="specialties">
                <SpecialtiesForm />
              </TabsContent>
              
              <TabsContent value="availability">
                <AvailabilityForm />
              </TabsContent>
              
              <TabsContent value="credentials">
                <CredentialsForm />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
