
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import TimelineItem from '@/components/timeline/TimelineItem';
import { Button } from '@/components/ui/button';
import { FileText, Download, Plus } from 'lucide-react';
import { useTimeline } from '@/hooks/use-timeline';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

const TimelinePage = () => {
  const { events, loading, addEvent } = useTimeline();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'visit',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    addEvent({
      title: newEvent.title,
      description: newEvent.description,
      type: newEvent.type as any,
      date: new Date(newEvent.date).toISOString(),
      related_file_url: null,
    });
    setShowAddDialog(false);
    setNewEvent({
      title: '',
      description: '',
      type: 'visit',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
  };

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
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Medical Event</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <form onSubmit={handleAddEvent}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="event-title" className="text-sm font-medium">Event Title</label>
                        <Input 
                          id="event-title" 
                          placeholder="e.g. Appointment with Dr. Smith"
                          value={newEvent.title}
                          onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="event-date" className="text-sm font-medium">Date</label>
                        <Input 
                          id="event-date" 
                          type="date"
                          value={newEvent.date}
                          onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="event-type" className="text-sm font-medium">Event Type</label>
                        <select 
                          id="event-type"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          value={newEvent.type}
                          onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                          required
                        >
                          <option value="visit">Doctor Visit</option>
                          <option value="prescription">Prescription</option>
                          <option value="lab">Lab Result</option>
                          <option value="medicine">Medication</option>
                          <option value="alert">Alert</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="event-description" className="text-sm font-medium">Description</label>
                        <Textarea 
                          id="event-description"
                          placeholder="Add details about this event"
                          value={newEvent.description}
                          onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Button type="submit">Add to Timeline</Button>
                      </div>
                    </div>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {events && events.some(event => event.type === 'alert') && (
          <div className="bg-medired-50 border-l-4 border-medired-500 p-4 mb-6 rounded-md">
            <h3 className="font-semibold">Important Health Alert</h3>
            <p>{events.find(event => event.type === 'alert')?.description || 'You have an important health alert.'}</p>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-medium mb-6">Your Health Events</h2>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mediblue-600"></div>
            </div>
          ) : events && events.length > 0 ? (
            <div className="space-y-0">
              {events.map((item, index) => (
                <TimelineItem 
                  key={item.id} 
                  item={{
                    id: item.id,
                    date: format(new Date(item.date), 'MMMM d, yyyy'),
                    title: item.title,
                    description: item.description || '',
                    type: item.type
                  }} 
                  isLast={index === events.length - 1}
                />
              ))}
            </div>
          ) : (
            <div className="bg-blue-50 p-6 rounded-md text-center">
              <p className="text-gray-600">You don't have any medical events recorded yet.</p>
              <Button className="mt-2" variant="outline" onClick={() => setShowAddDialog(true)}>
                Add Your First Event
              </Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default TimelinePage;
