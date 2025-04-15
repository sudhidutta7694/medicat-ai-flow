
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
        
        const { data, error } = await supabase
          .from('reports')
          .select(`
            *,
            doctor:doctor_id (
              specialty,
              profiles:id (
                first_name,
                last_name
              )
            ),
            appointment:appointment_id (
              scheduled_at
            )
          `)
          .eq('patient_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        console.log('Fetched reports:', data);
        setReports(data || []);
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
                    {report.doctor?.profiles ? (
                      <>
                        Dr. {report.doctor.profiles.first_name || 'Unknown'} {report.doctor.profiles.last_name || ''}
                        <div className="text-xs text-gray-500">{report.doctor.specialty || 'General Medicine'}</div>
                      </>
                    ) : (
                      'Unknown Doctor'
                    )}
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
