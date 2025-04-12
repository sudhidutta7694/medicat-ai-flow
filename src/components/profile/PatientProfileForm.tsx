
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const PatientProfileForm = () => {
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Profile Updated",
      description: "Your profile information has been successfully updated.",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</label>
          <Input id="firstName" defaultValue="John" />
        </div>
        <div className="space-y-2">
          <label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</label>
          <Input id="lastName" defaultValue="Doe" />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
          <Input id="email" type="email" defaultValue="john.doe@example.com" />
        </div>
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</label>
          <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
        </div>
        <div className="space-y-2">
          <label htmlFor="dob" className="text-sm font-medium text-gray-700">Date of Birth</label>
          <Input id="dob" type="date" defaultValue="1960-01-15" />
        </div>
        <div className="space-y-2">
          <label htmlFor="gender" className="text-sm font-medium text-gray-700">Gender</label>
          <select id="gender" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>
      </div>

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
          defaultValue="Type 2 Diabetes (diagnosed 2018), Hypertension (diagnosed 2015)" 
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="medications" className="text-sm font-medium text-gray-700">Current Medications</label>
        <Textarea 
          id="medications" 
          defaultValue="Metformin 500mg twice daily, Lisinopril 10mg once daily" 
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="allergies" className="text-sm font-medium text-gray-700">Allergies</label>
        <Textarea 
          id="allergies" 
          defaultValue="Penicillin, Sulfa drugs" 
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit">Save Profile</Button>
      </div>
    </form>
  );
};

export default PatientProfileForm;
