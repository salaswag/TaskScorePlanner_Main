
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Edit, Trash2, Plus, CheckCircle } from "lucide-react";

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
    description: "",
    dueDate: "",
    priority: 5
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newEvent.title.trim() && newEvent.dueDate) {
      onCreateEvent({
        ...newEvent,
        dueDate: new Date(newEvent.dueDate).toISOString()
      });
      setNewEvent({ title: "", description: "", dueDate: "", priority: 5 });
      setIsAddingEvent(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays > 0) return `In ${diffDays} days`;
    
    return date.toLocaleDateString();
  };

  const getPriorityColor = (priority) => {
    if (priority >= 8) return "border-red-200 bg-red-50 text-red-700";
    if (priority >= 5) return "border-yellow-200 bg-yellow-50 text-yellow-700";
    return "border-green-200 bg-green-50 text-green-700";
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date() && !events.find(e => e.dueDate === dueDate)?.completed;
  };

  // Sort events by due date
  const sortedEvents = [...events].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  return (
    <Card className="bg-white dark:bg-black shadow-sm border border-gray-200 dark:border-gray-800 mt-6">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-black dark:text-white">Timeline</h3>
          </div>
          <Button
            onClick={() => setIsAddingEvent(true)}
            size="sm"
            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Event
          </Button>
        </div>

        {isAddingEvent && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  placeholder="Event title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  className="mb-2"
                />
                <Input
                  placeholder="Description (optional)"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <Input
                  type="datetime-local"
                  value={newEvent.dueDate}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="mb-2"
                />
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Priority:</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={newEvent.priority}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-6">{newEvent.priority}</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2 mt-4">
              <Button type="submit" size="sm">Add Event</Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setIsAddingEvent(false);
                  setNewEvent({ title: "", description: "", dueDate: "", priority: 5 });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading timeline...</div>
          ) : sortedEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No timeline events yet</p>
            </div>
          ) : (
            sortedEvents.map((event) => (
              <div
                key={event.id}
                className={`p-4 rounded-lg border-l-4 transition-all duration-200 hover:shadow-md ${
                  event.completed 
                    ? "bg-gray-50 dark:bg-gray-900 border-gray-400 opacity-60" 
                    : isOverdue(event.dueDate)
                    ? "bg-red-50 dark:bg-red-900/20 border-red-400"
                    : getPriorityColor(event.priority)
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className={`font-medium ${
                        event.completed ? "line-through text-gray-500" : "text-gray-900 dark:text-gray-100"
                      }`}>
                        {event.title}
                      </h4>
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold border-2 ${
                        event.completed ? "border-gray-400 text-gray-500 bg-gray-100" : getPriorityColor(event.priority)
                      }`}>
                        {event.priority}
                      </span>
                    </div>
                    {event.description && (
                      <p className={`text-sm mb-2 ${
                        event.completed ? "text-gray-400" : "text-gray-600 dark:text-gray-400"
                      }`}>
                        {event.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span className={
                          event.completed ? "text-gray-400" : 
                          isOverdue(event.dueDate) ? "text-red-600 font-medium" : 
                          "text-gray-500"
                        }>
                          {formatDate(event.dueDate)}
                        </span>
                      </div>
                      {isOverdue(event.dueDate) && !event.completed && (
                        <span className="text-red-600 font-medium">OVERDUE</span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onUpdateEvent({
                        ...event,
                        completed: !event.completed,
                        completedAt: !event.completed ? new Date().toISOString() : null
                      })}
                      className={`text-xs px-2 py-1 h-6 ${
                        event.completed 
                          ? "text-gray-400 hover:text-gray-600" 
                          : "text-green-500 hover:text-green-700"
                      }`}
                      title={event.completed ? "Mark as incomplete" : "Mark as complete"}
                    >
                      <CheckCircle className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteEvent(event.id)}
                      className="text-red-500 hover:text-red-700 text-xs px-2 py-1 h-6"
                      title="Delete Event"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
