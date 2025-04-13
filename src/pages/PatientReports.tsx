
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { FilePlus, FileText, Download } from 'lucide-react';

const PatientReports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // First get the reports
        const { data: reportsData, error: reportsError } = await supabase
          .from('reports')
          .select('*')
          .eq('patient_id', user.id)
          .order('created_at', { ascending: false });
        
        if (reportsError) throw reportsError;
        
        if (!reportsData || reportsData.length === 0) {
          setReports([]);
          return;
        }

        // Then get the doctor details
        const doctorIds = [...new Set(reportsData.map(r => r.doctor_id))];
        const { data: doctorData, error: doctorError } = await supabase
          .from('doctors')
          .select('id, specialty')
          .in('id', doctorIds);
          
        if (doctorError) throw doctorError;
        
        // Get doctor profiles
        const { data: doctorProfiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', doctorIds);
          
        if (profileError) throw profileError;
        
        // Get appointment data if needed
        const appointmentIds = reportsData
          .map(r => r.appointment_id)
          .filter(id => id !== null);
          
        let appointmentData: any[] = [];
        
        if (appointmentIds.length > 0) {
          const { data: apptData, error: apptError } = await supabase
            .from('appointments')
            .select('id, scheduled_at')
            .in('id', appointmentIds);
            
          if (!apptError) {
            appointmentData = apptData || [];
          }
        }
        
        // Combine all the data
        const enrichedReports = reportsData.map(report => {
          const doctor = doctorData?.find(d => d.id === report.doctor_id);
          const doctorProfile = doctorProfiles?.find(p => p.id === report.doctor_id);
          const appointment = appointmentData.find(a => a.id === report.appointment_id);
          
          return {
            ...report,
            doctor: {
              specialty: doctor?.specialty || 'Unknown',
              profiles: {
                first_name: doctorProfile?.first_name || 'Unknown',
                last_name: doctorProfile?.last_name || ''
              }
            },
            appointment: appointment || null
          };
        });
        
        setReports(enrichedReports);
      } catch (error: any) {
        console.error('Error fetching reports:', error);
        toast({
          title: 'Error',
          description: error.message || 'Could not load your medical reports',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mediblue-600"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FilePlus className="h-5 w-5" /> Your Medical Reports
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reports.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Report Title</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    {new Date(report.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{report.title}</TableCell>
                  <TableCell>
                    Dr. {report.doctor.profiles.first_name} {report.doctor.profiles.last_name}
                    <div className="text-xs text-gray-500">{report.doctor.specialty}</div>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="mr-2">
                          <FileText className="h-4 w-4 mr-1" /> View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>{report.title}</DialogTitle>
                        </DialogHeader>
                        <div className="prose max-w-none">
                          <div className="mb-6 border-b pb-4">
                            <h3 className="text-lg font-medium">Visit Summary</h3>
                            <div className="whitespace-pre-line">{report.visit_summary}</div>
                          </div>
                          
                          <div className="mb-6">
                            <h3 className="text-lg font-medium">Prescription</h3>
                            <div className="whitespace-pre-line">{report.prescription}</div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-1" /> Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">You don't have any medical reports yet</p>
            <p className="text-gray-500 text-sm mt-2">Reports will appear here after your doctor visits</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientReports;
