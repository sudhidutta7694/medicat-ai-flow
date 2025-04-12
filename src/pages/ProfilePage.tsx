
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import PatientProfileForm from '@/components/profile/PatientProfileForm';
import MedicationCard, { Medication } from '@/components/profile/MedicationCard';
import { User, FilePlus, Pills, Bell } from 'lucide-react';

const ProfilePage = () => {
  // Sample medications data
  const medications: Medication[] = [
    {
      id: '1',
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily in the morning',
      startDate: 'April 10, 2025',
      instructions: 'Take with food. Monitor blood pressure regularly.',
      isActive: true,
    },
    {
      id: '2',
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily with meals',
      startDate: 'January 15, 2025',
      instructions: 'Take with breakfast and dinner.',
      isActive: true,
    },
    {
      id: '3',
      name: 'Vitamin D',
      dosage: '1000 IU',
      frequency: 'Once daily',
      startDate: 'March 15, 2025',
      instructions: 'Take with a meal containing fat for better absorption.',
      isActive: true,
    },
    {
      id: '4',
      name: 'Amoxicillin',
      dosage: '500mg',
      frequency: 'Three times daily',
      startDate: 'February 1, 2025',
      endDate: 'February 10, 2025',
      instructions: 'Completed full course for sinus infection.',
      isActive: false,
    },
  ];

  return (
    <MainLayout>
      <div className="mediflow-container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Health Profile</h1>
          <p className="text-gray-600 mt-1">
            Manage your personal information, medications, and medical history
          </p>
        </div>

        {/* Medical alert banner */}
        <div className="medical-alert mb-6">
          <div className="flex items-center">
            <Bell className="h-5 w-5 mr-2 text-medired-600" />
            <h3 className="font-semibold">Medication Alert</h3>
          </div>
          <p>Your Metformin prescription will need refilling in 5 days. Contact your healthcare provider.</p>
        </div>

        {/* Patient Profile Tabs */}
        <Tabs defaultValue="personal">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="personal">
              <User className="h-4 w-4 mr-2" /> Personal Info
            </TabsTrigger>
            <TabsTrigger value="medications">
              <Pills className="h-4 w-4 mr-2" /> Medications
            </TabsTrigger>
            <TabsTrigger value="records">
              <FilePlus className="h-4 w-4 mr-2" /> Medical Records
            </TabsTrigger>
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal">
            <Card>
              <CardContent className="pt-6">
                <PatientProfileForm />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medications Tab */}
          <TabsContent value="medications">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-lg font-medium mb-4">Current and Past Medications</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {medications.map((medication) => (
                    <MedicationCard key={medication.id} medication={medication} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical Records Tab */}
          <TabsContent value="records">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-lg font-medium mb-4">Medical Records</h2>
                <p className="text-gray-600">
                  You can view and download your medical records here. Records are encrypted and HIPAA-compliant.
                </p>
                <div className="bg-blue-50 p-4 rounded-md mt-4">
                  <p className="text-sm text-center text-gray-600">
                    No medical records have been uploaded yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
