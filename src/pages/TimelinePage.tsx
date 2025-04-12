
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import TimelineItem, { TimelineItemType } from '@/components/timeline/TimelineItem';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';

const TimelinePage = () => {
  // Sample timeline data
  const timelineItems: TimelineItemType[] = [
    {
      id: '1',
      date: 'April 10, 2025',
      title: 'Prescription for Hypertension',
      description: 'Dr. Johnson prescribed Lisinopril 10mg once daily for blood pressure management.',
      type: 'prescription'
    },
    {
      id: '2',
      date: 'April 5, 2025',
      title: 'Blood Work Results',
      description: 'Complete blood count and metabolic panel results received. All values within normal range except slightly elevated cholesterol.',
      type: 'lab'
    },
    {
      id: '3',
      date: 'April 2, 2025',
      title: 'Appointment with Dr. Johnson',
      description: 'Regular check-up appointment. Blood pressure reading was 140/90. Doctor recommended diet modifications and exercise.',
      type: 'visit'
    },
    {
      id: '4',
      date: 'March 25, 2025',
      title: 'Medication Alert',
      description: 'Your prescription for Metformin is running low. Please refill within the next 5 days.',
      type: 'alert'
    },
    {
      id: '5',
      date: 'March 15, 2025',
      title: 'New Medication Added',
      description: 'Started Vitamin D supplement 1000 IU daily as recommended by Dr. Johnson.',
      type: 'medicine'
    },
  ];

  return (
    <MainLayout>
      <div className="mediflow-container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Medical Timeline</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
          </div>
        </div>

        {/* Medical alert banner */}
        <div className="medical-alert mb-6">
          <h3 className="font-semibold">Important Health Alert</h3>
          <p>Your prescription for Metformin is running low. Please refill within the next 5 days.</p>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-medium mb-6">Your Health Events</h2>
          <div className="space-y-0">
            {timelineItems.map((item, index) => (
              <TimelineItem 
                key={item.id} 
                item={item} 
                isLast={index === timelineItems.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default TimelinePage;
