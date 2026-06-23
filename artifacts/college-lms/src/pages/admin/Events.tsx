import React, { useState } from 'react';
import { useListEvents, useCreateEvent, useDeleteEvent, useListDepartments } from '@workspace/api-client-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, CalendarDays, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { format, isSameMonth, parseISO } from 'date-fns';

export default function AdminEvents() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "", description: "", startDate: "", endDate: "", type: "event", departmentId: "none"
  });

  const { data: events, isLoading } = useListEvents();
  const { data: depts } = useListDepartments();

  const createEvent = useCreateEvent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/events'] });
        toast.success("Event created successfully");
        setIsAddModalOpen(false);
        setFormData({ title: "", description: "", startDate: "", endDate: "", type: "event", departmentId: "none" });
      }
    }
  });

  const deleteEvent = useDeleteEvent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/events'] });
        toast.success("Event deleted");
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEvent.mutate({
      data: {
        title: formData.title,
        description: formData.description,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        type: formData.type,
        departmentId: formData.departmentId !== "none" ? Number(formData.departmentId) : null
      }
    });
  };

  const getEventColor = (type: string) => {
    switch(type) {
      case 'exam': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'holiday': return 'bg-success/20 text-success border-success/30';
      default: return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  // Group events by month
  const groupedEvents = events?.reduce((acc: any, event) => {
    const month = format(parseISO(event.startDate), 'MMMM yyyy');
    if (!acc[month]) acc[month] = [];
    acc[month].push(event);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Academic Calendar</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Event
        </Button>
      </div>

      {isLoading ? <LoadingSkeleton type="dashboard" /> : (
        <div className="space-y-8">
          {groupedEvents && Object.entries(groupedEvents).map(([month, monthEvents]: [string, any]) => (
            <div key={month} className="space-y-4">
              <h2 className="text-lg font-semibold text-muted-foreground border-b border-border pb-2">{month}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {monthEvents.map((event: any) => (
                  <Card key={event.id} className="bg-card border-card-border">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <Badge variant="outline" className={`capitalize ${getEventColor(event.type)}`}>
                          {event.type}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive -mr-2 -mt-2" onClick={() => deleteEvent.mutate({ id: event.id })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardTitle className="text-lg mt-2">{event.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <div className="flex items-center">
                          <CalendarDays className="h-4 w-4 mr-2" />
                          <span>{format(parseISO(event.startDate), 'MMM d, yyyy')}</span>
                          {event.endDate && event.startDate !== event.endDate && (
                            <span> - {format(parseISO(event.endDate), 'MMM d, yyyy')}</span>
                          )}
                        </div>
                        {event.description && <p className="line-clamp-2 mt-2">{event.description}</p>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
          {(!events || events.length === 0) && (
            <div className="text-center p-12 border border-dashed rounded-lg text-muted-foreground">
              No upcoming events.
            </div>
          )}
        </div>
      )}

      <Modal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} title="Add Event">
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Event Title</Label>
            <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Mid-Term Exams" />
          </div>
          
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>End Date (Optional)</Label>
              <Input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">General Event</SelectItem>
                  <SelectItem value="exam">Examination</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Specific Department (Optional)</Label>
              <Select value={formData.departmentId} onValueChange={v => setFormData({...formData, departmentId: v})}>
                <SelectTrigger><SelectValue placeholder="All Departments" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All Departments</SelectItem>
                  {depts?.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-4 gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createEvent.isPending}>
              {createEvent.isPending ? "Saving..." : "Create Event"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
