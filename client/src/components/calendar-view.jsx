import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Clock, Check, X, Lock } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isAfter } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';

const DEEP_WORK_OPTIONS = [
  { value: 'lots-deep-work', label: 'Lots of deep work', color: 'bg-emerald-500', lightColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
  { value: 'some-deep-work', label: 'Some deep work', color: 'bg-green-500', lightColor: 'bg-green-100 dark:bg-green-900/30' },
  { value: 'little-deep-work', label: 'Very little deep work', color: 'bg-yellow-500', lightColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  { value: 'no-deep-work', label: 'No deep work', color: 'bg-gray-500', lightColor: 'bg-gray-100 dark:bg-gray-900/30' }
];

const SHALLOW_WORK_OPTIONS = [
  { value: 'lots-shallow-needed', label: 'Lots of shallow work but needed', color: 'bg-blue-500', lightColor: 'bg-blue-100 dark:bg-blue-900/30' },
  { value: 'some-shallow-needed', label: 'Some shallow work but needed', color: 'bg-cyan-500', lightColor: 'bg-cyan-100 dark:bg-cyan-900/30' },
  { value: 'no-shallow-work', label: 'No shallow work', color: 'bg-slate-500', lightColor: 'bg-slate-100 dark:bg-slate-900/30' },
  { value: 'some-shallow-not-needed', label: 'Some shallow work kinda not needed', color: 'bg-orange-500', lightColor: 'bg-orange-100 dark:bg-orange-900/30' },
  { value: 'lots-shallow-not-needed', label: 'A lot of shallow work not needed', color: 'bg-red-500', lightColor: 'bg-red-100 dark:bg-red-900/30' }
];

export function CalendarView() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [sliderTime, setSliderTime] = useState(0);
  const [timeData, setTimeData] = useState({}); // Store manual time entries
  const [isLoading, setIsLoading] = useState(false);
  const [workType, setWorkType] = useState({
    deepWork: 'some-deep-work',
    shallowWork: 'some-shallow-needed'
  });
  
  const isAnonymous = !user || user.isAnonymous;

  useEffect(() => {
    fetchTimeEntries();
  }, [user, isAnonymous]);

  const fetchTimeEntries = async () => {
    // Don't fetch time entries for anonymous users
    if (isAnonymous) {
      console.log('👤 Anonymous user - time entries not available');
      setTimeData({});
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiRequest('/api/time-entries');
      if (response.ok) {
        const data = await response.json();
        // Convert old format to new format if needed
        const formattedData = {};
        Object.keys(data).forEach(date => {
          if (typeof data[date] === 'number') {
            // Old format - just time
            formattedData[date] = {
              timeInMinutes: data[date],
              deepWork: 'some-deep-work',
              shallowWork: 'some-shallow-needed'
            };
          } else {
            // New format - already has work types
            formattedData[date] = data[date];
          }
        });
        setTimeData(formattedData);
      } else {
        console.error('Failed to fetch time entries:', response.status);
        setTimeData({});
      }
    } catch (error) {
      console.error('Error fetching time entries:', error);
      setTimeData({});
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timeInMinutes) => {
    if (!timeInMinutes || timeInMinutes === 0) return '0m';
    if (timeInMinutes >= 60) {
      const hours = Math.floor(timeInMinutes / 60);
      const minutes = timeInMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } else {
      return `${timeInMinutes}m`;
    }
  };

  const formatSliderTime = (timeInMinutes) => {
    if (timeInMinutes === 0) return '0m';
    if (timeInMinutes >= 60) {
      const hours = Math.floor(timeInMinutes / 60);
      const minutes = timeInMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } else {
      return `${timeInMinutes}m`;
    }
  };

  const getWorkTypeColorClasses = (timeEntry) => {
    if (!timeEntry || !timeEntry.timeInMinutes || timeEntry.timeInMinutes === 0) return '';

    const deepWorkOption = DEEP_WORK_OPTIONS.find(opt => opt.value === timeEntry.deepWork);
    const shallowWorkOption = SHALLOW_WORK_OPTIONS.find(opt => opt.value === timeEntry.shallowWork);
    
    // Primary color from deep work, with accent from shallow work
    const primaryColor = deepWorkOption ? deepWorkOption.lightColor : 'bg-gray-100 dark:bg-gray-900/30';
    
    return `${primaryColor} border-l-4 ${shallowWorkOption ? shallowWorkOption.color.replace('bg-', 'border-') : 'border-gray-400'}`;
  };

  const handleTimeEdit = (date) => {
    // Don't allow editing for anonymous users
    if (isAnonymous) {
      return;
    }

    // Don't allow editing future dates
    if (isAfter(date, new Date())) {
      return;
    }

    const dateKey = format(date, 'yyyy-MM-dd');
    const existingEntry = timeData[dateKey];
    setSelectedDate(date);
    setSliderTime(existingEntry?.timeInMinutes || 0);
    setWorkType({
      deepWork: existingEntry?.deepWork || 'some-deep-work',
      shallowWork: existingEntry?.shallowWork || 'some-shallow-needed'
    });
    setShowTimeModal(true);
  };

  const handleTimeSave = async () => {
    // Don't allow saving for anonymous users
    if (isAnonymous) {
      return;
    }

    setIsLoading(true);
    if (selectedDate) {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');

      try {
        // Save to MongoDB via API
        const response = await apiRequest('/api/time-entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date: dateKey,
            timeInMinutes: sliderTime,
            deepWork: workType.deepWork,
            shallowWork: workType.shallowWork
          })
        });

        if (response.ok) {
          // Update local state
          setTimeData(prev => ({
            ...prev,
            [dateKey]: {
              timeInMinutes: sliderTime,
              deepWork: workType.deepWork,
              shallowWork: workType.shallowWork
            }
          }));

          console.log('Time entry saved successfully to MongoDB');
        } else {
          console.error('Failed to save time entry to MongoDB');
        }
      } catch (error) {
        console.error('Error saving time entry:', error);
      }
    }

    setShowTimeModal(false);
    setSelectedDate(null);
    setSliderTime(0);
    setIsLoading(false);
  };

  const handleTimeCancel = () => {
    setShowTimeModal(false);
    setSelectedDate(null);
    setSliderTime(0);
    setWorkType({
      deepWork: 'some-deep-work',
      shallowWork: 'some-shallow-needed'
    });
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      setCurrentMonth(subMonths(currentMonth, 1));
    } else {
      setCurrentMonth(addMonths(currentMonth, 1));
    }
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <div className="w-full space-y-4">
      {/* Authentication Required Message */}
      {isAnonymous && (
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Authentication Required
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  You must be logged in to use the time tracking calendar. Please log in to track your work hours.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToToday}
            className="text-xs"
            disabled={isAnonymous}
          >
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
            disabled={isAnonymous}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
            disabled={isAnonymous}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      {isLoading ? (
        <Card className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <CardContent className="p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-4">Loading calendar...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={`bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${isAnonymous ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const timeEntry = timeData[dateKey];
              const timeSpent = timeEntry?.timeInMinutes || 0;
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());
              const isFuture = isAfter(day, new Date());

              return (
                <div
                  key={index}
                  className={`
                  min-h-[120px] p-2 border-b border-r border-gray-200 dark:border-gray-600 relative cursor-pointer
                  ${!isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800/30 text-gray-400' : ''}
                  ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  ${isFuture ? 'opacity-50' : ''}
                  ${isCurrentMonth && !isFuture && timeSpent > 0 ? getWorkTypeColorClasses(timeEntry) : ''}
                  ${isCurrentMonth && !isFuture && timeSpent === 0 ? 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
                `}
                  onClick={() => !isFuture && isCurrentMonth && !isAnonymous && handleTimeEdit(day)}
                  title={isAnonymous ? "Login required to track time" : (!isFuture && isCurrentMonth ? (timeSpent > 0 ? `${formatTime(timeSpent)} worked\nDeep work: ${DEEP_WORK_OPTIONS.find(opt => opt.value === timeEntry?.deepWork)?.label || 'Some deep work'}\nShallow work: ${SHALLOW_WORK_OPTIONS.find(opt => opt.value === timeEntry?.shallowWork)?.label || 'Some shallow work but needed'}\nClick to edit` : "Click to add time") : "")}
                >
                  <div className="flex flex-col h-full relative z-10">
                    {/* Date Number */}
                    <div className={`
                    text-sm font-medium mb-2
                    ${isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}
                    ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100'}
                  `}>
                      {format(day, 'd')}
                    </div>

                    {/* Time Display and Edit */}
                    {isCurrentMonth && !isFuture && timeSpent === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <div
                          className={`rounded-lg p-2 transition-colors w-full text-center ${isAnonymous ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                          onClick={() => !isAnonymous && handleTimeEdit(day)}
                          title={isAnonymous ? "Login required to track time" : "Click to add time"}
                        >
                          <div className="flex items-center justify-center gap-1 text-gray-400 dark:text-gray-500">
                            {isAnonymous ? <Lock className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            <span className="text-xs">{isAnonymous ? "Login" : "Add"}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Time display for cells with time */}
                    {isCurrentMonth && !isFuture && timeSpent > 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span className="text-lg font-semibold">
                            {formatTime(timeSpent)}
                          </span>
                        </div>
                        
                        {/* Work Type Badges */}
                        <div className="flex flex-col gap-1 w-full">
                          {timeEntry?.deepWork && (
                            <Badge 
                              variant="secondary" 
                              className={`text-xs px-1 py-0.5 w-full justify-center ${DEEP_WORK_OPTIONS.find(opt => opt.value === timeEntry.deepWork)?.lightColor || 'bg-gray-100'}`}
                              title={DEEP_WORK_OPTIONS.find(opt => opt.value === timeEntry.deepWork)?.label}
                            >
                              {DEEP_WORK_OPTIONS.find(opt => opt.value === timeEntry.deepWork)?.label.split(' ').slice(0, 2).join(' ')}
                            </Badge>
                          )}
                          {timeEntry?.shallowWork && (
                            <Badge 
                              variant="secondary" 
                              className={`text-xs px-1 py-0.5 w-full justify-center ${SHALLOW_WORK_OPTIONS.find(opt => opt.value === timeEntry.shallowWork)?.lightColor || 'bg-gray-100'}`}
                              title={SHALLOW_WORK_OPTIONS.find(opt => opt.value === timeEntry.shallowWork)?.label}
                            >
                              {SHALLOW_WORK_OPTIONS.find(opt => opt.value === timeEntry.shallowWork)?.label.split(' ').slice(0, 2).join(' ')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {isFuture && isCurrentMonth && (
                      <div className="flex-1 flex items-center justify-center">
                        <span className="text-xs text-gray-400">Future date</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Instructions and Small Disclaimer */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center gap-2">
          {isAnonymous ? <Lock className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
          <span>
            {isAnonymous 
              ? "Login required to track time on calendar" 
              : "Click any day to manually enter time worked"
            }
          </span>
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500">
          Manual time tracking - not connected to tasks
        </div>
      </div>

      {/* Time Edit Modal */}
      <Dialog open={showTimeModal} onOpenChange={setShowTimeModal}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Time Entry - {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 p-4">
            {/* Time Slider */}
            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Time worked: <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatSliderTime(sliderTime)}</span>
              </label>
              <div className="relative max-w-md mx-auto">
                <input
                  type="range"
                  min="0"
                  max="720"
                  step="15"
                  value={sliderTime}
                  onChange={(e) => setSliderTime(parseInt(e.target.value))}
                  className="slider w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span>0m</span>
                  <span>3h</span>
                  <span>6h</span>
                  <span>9h</span>
                  <span>12h</span>
                </div>
              </div>
            </div>

            {/* Work Type Selectors - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Deep Work Selector */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Deep Work Level
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {DEEP_WORK_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      className={`cursor-pointer rounded-lg border-2 p-3 transition-all hover:shadow-md ${
                        workType.deepWork === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => setWorkType(prev => ({ ...prev, deepWork: option.value }))}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${option.color}`}></div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {option.label}
                        </span>
                        {workType.deepWork === option.value && (
                          <Check className="h-4 w-4 text-blue-600 ml-auto" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shallow Work Selector */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Shallow Work Level
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {SHALLOW_WORK_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      className={`cursor-pointer rounded-lg border-2 p-3 transition-all hover:shadow-md ${
                        workType.shallowWork === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => setWorkType(prev => ({ ...prev, shallowWork: option.value }))}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${option.color}`}></div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {option.label}
                        </span>
                        {workType.shallowWork === option.value && (
                          <Check className="h-4 w-4 text-blue-600 ml-auto" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button onClick={handleTimeCancel} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleTimeSave}
                className="flex-1 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Time'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}