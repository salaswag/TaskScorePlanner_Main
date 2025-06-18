
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Plus, Trash2 } from "lucide-react";

export default function TimelineSection({ 
  events, 
  onCreateEvent, 
  onUpdateEvent, 
  onDeleteEvent, 
  isLoading 
}) {
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    dueDate: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newEvent.title.trim() && newEvent.dueDate) {
      onCreateEvent({
        ...newEvent,
        dueDate: new Date(newEvent.dueDate).toISOString(),
        priority: 5,
        description: ""
      });
      setNewEvent({ title: "", dueDate: "" });
      setIsAddingEvent(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const getDaysFromToday = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return Math.ceil((date - today) / (1000 * 60 * 60 * 24));
  };

  const getTimelinePosition = (dateString) => {
    const daysFromToday = getDaysFromToday(dateString);
    const maxDays = 30; // Show next 30 days
    const minDays = -7;  // Show past 7 days
    
    if (daysFromToday < minDays) return 0;
    if (daysFromToday > maxDays) return 100;
    
    return ((daysFromToday - minDays) / (maxDays - minDays)) * 100;
  };

  const handleDragStart = (e, event) => {
    e.dataTransfer.setData("text/plain", event.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newDaysFromToday) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData("text/plain");
    const event = events.find(e => e.id.toString() === eventId);
    
    if (event) {
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + newDaysFromToday);
      
      onUpdateEvent({
        ...event,
        dueDate: newDate.toISOString()
      });
    }
  };

  // Sort events by completion status, then by date
  const sortedEvents = [...events].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  return (
    <div className="w-80 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-black h-screen overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Timeline</h3>
          </div>
          <Button
            onClick={() => setIsAddingEvent(true)}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {isAddingEvent && (
          <form onSubmit={handleSubmit} className="space-y-2">
            <Input
              placeholder="Event title"
              value={newEvent.title}
              onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
              className="h-8 text-xs"
            />
            <Input
              type="date"
              value={newEvent.dueDate}
              onChange={(e) => setNewEvent(prev => ({ ...prev, dueDate: e.target.value }))}
              className="h-8 text-xs"
            />
            <div className="flex space-x-1">
              <Button type="submit" size="sm" className="h-6 text-xs px-2">Add</Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => {
                  setIsAddingEvent(false);
                  setNewEvent({ title: "", dueDate: "" });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Timeline Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500 text-xs">Loading...</div>
          ) : sortedEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-xs">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No events yet</p>
            </div>
          ) : (
            sortedEvents.map((event) => (
              <div
                key={event.id}
                className={`group relative transition-all duration-200 ${
                  event.completed ? "opacity-60" : ""
                }`}
              >
                {/* Event Item */}
                <div className="flex items-center space-x-2 py-1">
                  <Checkbox
                    checked={event.completed || false}
                    onCheckedChange={(checked) => onUpdateEvent({
                      ...event,
                      completed: checked,
                      completedAt: checked ? new Date().toISOString() : null
                    })}
                    className="h-3 w-3"
                  />
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs block truncate ${
                      event.completed 
                        ? "line-through text-gray-400" 
                        : "text-gray-900 dark:text-gray-100"
                    }`}>
                      {event.title}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatDate(event.dueDate)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteEvent(event.id)}
                    className="opacity-0 group-hover:opacity-100 h-4 w-4 p-0 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-2 w-2" />
                  </Button>
                </div>

                {/* Timeline Bar */}
                <div className="relative h-2 bg-gray-100 dark:bg-gray-800 rounded-full mb-2 overflow-hidden">
                  <div 
                    className={`absolute h-full rounded-full cursor-grab active:cursor-grabbing transition-all duration-200 ${
                      event.completed 
                        ? "bg-gray-400" 
                        : getDaysFromToday(event.dueDate) < 0
                        ? "bg-red-400"
                        : getDaysFromToday(event.dueDate) === 0
                        ? "bg-yellow-400"
                        : "bg-blue-400"
                    }`}
                    style={{
                      left: `${Math.max(0, getTimelinePosition(event.dueDate) - 5)}%`,
                      width: '10%'
                    }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, event)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => {
                      const rect = e.currentTarget.parentElement.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const percentage = (x / rect.width) * 100;
                      const maxDays = 30;
                      const minDays = -7;
                      const newDaysFromToday = Math.round(((percentage / 100) * (maxDays - minDays)) + minDays);
                      handleDrop(e, newDaysFromToday);
                    }}
                  />
                  {/* Today indicator */}
                  <div 
                    className="absolute w-0.5 h-full bg-gray-900 dark:bg-gray-100"
                    style={{ left: `${getTimelinePosition(new Date().toISOString())}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
