
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/use-profile';
import { CheckCircle2, XCircle, Calendar, FilePlus, Clock, Bell, Users, FileText, Download, Info } from 'lucide-react';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const { getPatientMedicalData } = useProfile();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [patientNotes, setPatientNotes] = useState('');
  const [reportGenerating, setReportGenerating] = useState(false);
  const [patientMedicalData, setPatientMedicalData] = useState<any>(null);
  const [loadingPatientData, setLoadingPatientData] = useState(false);
  const [viewingPatientId, setViewingPatientId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoctorData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select(`
            *,
            patient:patient_id (
              id,
              first_name,
              last_name,
              email,
              phone,
              date_of_birth,
              gender
            )
          `)
          .eq('doctor_id', user.id);
        
        if (appointmentsError) throw appointmentsError;
        
        const now = new Date();
        const upcoming = appointmentsData
          .filter(apt => apt.status === 'confirmed' && new Date(apt.scheduled_at) > now)
          .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
        
        const pending = appointmentsData.filter(apt => apt.status === 'pending');
        
        setAppointments(upcoming);
        setPendingAppointments(pending);

        // Extract unique patient IDs
        const patientIds = [...new Set(appointmentsData.map(apt => apt.patient_id))];
        
        if (patientIds.length > 0) {
          const { data: patientProfiles, error: patientError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', patientIds);
          
          if (patientError) throw patientError;
          setPatients(patientProfiles || []);
        }
        
        const { data: reportsData, error: reportsError } = await supabase
          .from('reports')
          .select(`
            *,
            patient:patient_id (
              id,
              first_name,
              last_name
            )
          `)
          .eq('doctor_id', user.id)
          .order('created_at', { ascending: false });
        
        if (reportsError) throw reportsError;
        setReports(reportsData || []);
      } catch (error: any) {
        console.error('Error fetching doctor data:', error);
        toast({
          title: 'Error',
          description: error.message || 'Could not load doctor dashboard data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, [user]);

  const handleAppointmentAction = async (appointmentId: string, action: 'confirm' | 'reject') => {
    try {
      const status = action === 'confirm' ? 'confirmed' : 'canceled';
      
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId);
      
      if (error) throw error;
      
      setPendingAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
      
      if (status === 'confirmed') {
        const updatedAppointment = pendingAppointments.find(apt => apt.id === appointmentId);
        if (updatedAppointment) {
          updatedAppointment.status = status;
          setAppointments(prev => [...prev, updatedAppointment].sort(
            (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
          ));
        }
      }
      
      toast({
        title: 'Success',
        description: `Appointment ${action === 'confirm' ? 'confirmed' : 'rejected'} successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Could not ${action} the appointment`,
        variant: 'destructive',
      });
    }
  };

  const generateReport = async (appointmentId: string) => {
    try {
      setReportGenerating(true);
      
      const appointment = [...appointments, ...pendingAppointments].find(apt => apt.id === appointmentId);
      
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      console.log("Generating report with data:", {
        appointmentId: appointment.id,
        transcription: transcriptionText,
        patientNotes,
        doctorId: user?.id,
        patientId: appointment.patient_id,
      });
      
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          appointmentId: appointment.id,
          transcription: transcriptionText,
          patientNotes: patientNotes,
          doctorId: user?.id,
          patientId: appointment.patient_id,
        },
      });
      
      if (error) throw error;
      
      console.log("Report generation response:", data);
      
      if (data && data.report) {
        setReports(prev => [{
          ...data.report,
          patient: appointment.patient,
          created_at: new Date().toISOString()
        }, ...prev]);

        toast({
          title: 'Success',
          description: 'Report generated successfully',
        });
      } else {
        throw new Error('No report data returned');
      }
      
      setTranscriptionText('');
      setPatientNotes('');
      setSelectedAppointment(null);
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: error.message || 'Could not generate report',
        variant: 'destructive',
      });
    } finally {
      setReportGenerating(false);
    }
  };

  const sendReport = async (reportId: string, method: 'email' | 'whatsapp') => {
    try {
      const report = reports.find(r => r.id === reportId);
      
      if (!report) {
        throw new Error('Report not found');
      }
      
      const { data, error } = await supabase.functions.invoke('send-report', {
        body: {
          reportId: report.id,
          method,
          recipientId: report.patient_id,
          senderId: user?.id,
        },
      });
      
      if (error) throw error;
      
      setReports(prev => prev.map(r => {
        if (r.id === reportId) {
          return { ...r, is_sent: true };
        }
        return r;
      }));
      
      toast({
        title: 'Success',
        description: `Report sent via ${method} successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Could not send the report via ${method}`,
        variant: 'destructive',
      });
    }
  };

  const viewPatientMedicalData = async (patientId: string) => {
    if (viewingPatientId === patientId && patientMedicalData) {
      // Already loaded, just show the dialog
      return;
    }
    
    setLoadingPatientData(true);
    setViewingPatientId(patientId);
    
    try {
      const data = await getPatientMedicalData(patientId);
      setPatientMedicalData(data);
    } catch (error) {
      console.error('Error fetching patient medical data:', error);
      toast({
        title: 'Error',
        description: 'Could not load patient medical data',
        variant: 'destructive',
      });
      setPatientMedicalData(null);
    } finally {
      setLoadingPatientData(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage your appointments, patients, and reports
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-mediblue-600 mr-4" />
                <div>
                  <h3 className="text-2xl font-bold">{appointments.length}</h3>
                  <p className="text-gray-500 text-sm">Upcoming Appointments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Bell className="h-8 w-8 text-amber-500 mr-4" />
                <div>
                  <h3 className="text-2xl font-bold">{pendingAppointments.length}</h3>
                  <p className="text-gray-500 text-sm">Pending Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600 mr-4" />
                <div>
                  <h3 className="text-2xl font-bold">{patients.length}</h3>
                  <p className="text-gray-500 text-sm">Patients</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <FilePlus className="h-8 w-8 text-purple-600 mr-4" />
                <div>
                  <h3 className="text-2xl font-bold">{reports.length}</h3>
                  <p className="text-gray-500 text-sm">Reports Generated</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="appointments">
          <TabsList className="mb-6">
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="pending">Pending Requests</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {appointments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Issue</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell>
                            <div className="font-medium">
                              {appointment.patient?.first_name || 'Unknown'} {appointment.patient?.last_name || ''}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(appointment.scheduled_at)}</TableCell>
                          <TableCell>{appointment.issue || 'No issue specified'}</TableCell>
                          <TableCell className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => viewPatientMedicalData(appointment.patient_id)}>
                                  <Info className="h-4 w-4 mr-1" /> Medical Info
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>Patient Medical Information</DialogTitle>
                                </DialogHeader>
                                {loadingPatientData ? (
                                  <div className="flex justify-center py-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mediblue-600"></div>
                                  </div>
                                ) : patientMedicalData ? (
                                  <div className="space-y-4">
                                    <div>
                                      <h3 className="text-lg font-medium mb-2">Basic Information</h3>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <p className="text-sm text-gray-500">Name</p>
                                          <p>{patientMedicalData.profile?.first_name} {patientMedicalData.profile?.last_name}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">Date of Birth</p>
                                          <p>{patientMedicalData.profile?.date_of_birth ? new Date(patientMedicalData.profile.date_of_birth).toLocaleDateString() : 'Not provided'}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">Email</p>
                                          <p>{patientMedicalData.profile?.email || 'Not provided'}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">Phone</p>
                                          <p>{patientMedicalData.profile?.phone || 'Not provided'}</p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <h3 className="text-lg font-medium mb-2">Medical Conditions</h3>
                                      {patientMedicalData.conditions && patientMedicalData.conditions.length > 0 ? (
                                        <ul className="list-disc pl-5 space-y-1">
                                          {patientMedicalData.conditions.map((condition: any) => (
                                            <li key={condition.id}>
                                              <span className="font-medium">{condition.name}</span>
                                              {condition.diagnosed_date && (
                                                <span className="text-gray-500"> (diagnosed: {new Date(condition.diagnosed_date).toLocaleDateString()})</span>
                                              )}
                                              {condition.notes && <p className="text-sm text-gray-600">{condition.notes}</p>}
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-gray-500">No medical conditions recorded</p>
                                      )}
                                    </div>
                                    
                                    <div>
                                      <h3 className="text-lg font-medium mb-2">Current Medications</h3>
                                      {patientMedicalData.medications && patientMedicalData.medications.length > 0 ? (
                                        <ul className="list-disc pl-5 space-y-1">
                                          {patientMedicalData.medications.map((medication: any) => (
                                            <li key={medication.id}>
                                              <span className="font-medium">{medication.name}</span>
                                              {medication.dosage && <span> ({medication.dosage})</span>}
                                              {medication.frequency && <p className="text-sm">Frequency: {medication.frequency}</p>}
                                              {medication.instructions && <p className="text-sm text-gray-600">{medication.instructions}</p>}
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-gray-500">No medications recorded</p>
                                      )}
                                    </div>
                                    
                                    <div>
                                      <h3 className="text-lg font-medium mb-2">Allergies</h3>
                                      {patientMedicalData.allergies && patientMedicalData.allergies.length > 0 ? (
                                        <ul className="list-disc pl-5 space-y-1">
                                          {patientMedicalData.allergies.map((allergy: any) => (
                                            <li key={allergy.id}>
                                              <span className="font-medium">{allergy.name}</span>
                                              {allergy.severity && <span className="ml-2 text-sm">(Severity: {allergy.severity})</span>}
                                              {allergy.reaction && <p className="text-sm text-gray-600">Reaction: {allergy.reaction}</p>}
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-gray-500">No allergies recorded</p>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-center text-gray-500 py-4">Could not load patient medical data</p>
                                )}
                              </DialogContent>
                            </Dialog>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm">Generate Report</Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>Generate Visit Report</DialogTitle>
                                  <DialogDescription>
                                    Generate a report for the visit with {appointment.patient?.first_name || 'Unknown'} {appointment.patient?.last_name || ''}
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="grid gap-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Voice Transcription</label>
                                    <Textarea 
                                      placeholder="Paste or type the consultation transcription here" 
                                      value={transcriptionText}
                                      onChange={(e) => setTranscriptionText(e.target.value)}
                                      rows={8}
                                    />
                                    <p className="text-sm text-gray-500">
                                      You can upload an audio file for transcription or type/paste the transcription manually.
                                    </p>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Patient Notes</label>
                                    <Textarea 
                                      placeholder="Add notes about patient symptoms, concerns, or observations" 
                                      value={patientNotes}
                                      onChange={(e) => setPatientNotes(e.target.value)}
                                      rows={4}
                                    />
                                  </div>
                                </div>
                                
                                <DialogFooter>
                                  <Button 
                                    type="submit" 
                                    onClick={() => generateReport(appointment.id)}
                                    disabled={reportGenerating || !transcriptionText}
                                  >
                                    {reportGenerating ? 'Generating...' : 'Generate Report'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button size="sm" variant="outline" onClick={() => navigate('/chat?patient=' + appointment.patient_id)}>
                              Chat History
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">You have no upcoming appointments</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Appointment Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingAppointments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Requested Date</TableHead>
                        <TableHead>Issue</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingAppointments.map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell>
                            <div className="font-medium">
                              {appointment.patient?.first_name || 'Unknown'} {appointment.patient?.last_name || ''}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(appointment.scheduled_at)}</TableCell>
                          <TableCell>{appointment.issue || 'No issue specified'}</TableCell>
                          <TableCell className="flex space-x-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleAppointmentAction(appointment.id, 'confirm')}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleAppointmentAction(appointment.id, 'reject')}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Decline
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">You have no pending appointment requests</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="patients">
            <Card>
              <CardHeader>
                <CardTitle>Your Patients</CardTitle>
              </CardHeader>
              <CardContent>
                {patients.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Date of Birth</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patients.map((patient) => (
                        <TableRow key={patient.id}>
                          <TableCell>
                            <div className="font-medium">{patient.first_name || 'Unknown'} {patient.last_name || ''}</div>
                          </TableCell>
                          <TableCell>{patient.email || 'N/A'}</TableCell>
                          <TableCell>{patient.phone || 'N/A'}</TableCell>
                          <TableCell>
                            {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => viewPatientMedicalData(patient.id)}>
                                  <Info className="h-4 w-4 mr-1" /> Medical Info
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                {/* Dialog content similar to the one above */}
                              </DialogContent>
                            </Dialog>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => navigate('/chat?patient=' + patient.id)}
                            >
                              Chat History
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => navigate(`/timeline?patient=${patient.id}`)}
                            >
                              View Timeline
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">You don't have any patients yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Generated Reports</CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Report Title</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Created Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>
                            <div className="font-medium">{report.title}</div>
                          </TableCell>
                          <TableCell>
                            {report.patient?.first_name || 'Unknown'} {report.patient?.last_name || ''}
                          </TableCell>
                          <TableCell>
                            {new Date(report.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {report.is_sent ? 
                              <span className="text-green-600 flex items-center">
                                <CheckCircle2 className="h-4 w-4 mr-1" /> Sent
                              </span> : 
                              <span className="text-amber-600 flex items-center">
                                <Clock className="h-4 w-4 mr-1" /> Not Sent
                              </span>
                            }
                          </TableCell>
                          <TableCell className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">View Report</Button>
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
                                  
                                  <div className="mb-6 border-b pb-4">
                                    <h3 className="text-lg font-medium">Prescription</h3>
                                    <div className="whitespace-pre-line">{report.prescription}</div>
                                  </div>
                                </div>
                                <DialogFooter className="flex justify-between">
                                  <div className="flex space-x-2">
                                    <Button 
                                      variant="outline" 
                                      onClick={() => sendReport(report.id, 'email')}
                                      disabled={report.is_sent}
                                    >
                                      Send via Email
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      onClick={() => sendReport(report.id, 'whatsapp')}
                                      disabled={report.is_sent}
                                    >
                                      Send via WhatsApp
                                    </Button>
                                  </div>
                                  <Button variant="default">Download PDF</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            {!report.is_sent && (
                              <Button 
                                size="sm" 
                                onClick={() => sendReport(report.id, 'email')}
                              >
                                Send to Patient
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No reports have been generated yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default DoctorDashboard;
