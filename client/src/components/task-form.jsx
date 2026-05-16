import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Brain, Coffee, Folder } from "lucide-react";
import { useKeyboardAware } from "@/hooks/use-keyboard-aware";
import { useInputFocus } from "@/hooks/use-input-focus";

function WorkTypeToggle({ value, onChange }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800">
      <button
        type="button"
        onClick={() => onChange(value === "deep" ? "shallow" : "deep")}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
          value === "deep"
            ? "bg-blue-500 text-white shadow-sm"
            : "text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
      >
        <Brain className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Deep</span>
      </button>
      <button
        type="button"
        onClick={() => onChange(value === "shallow" ? "deep" : "shallow")}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
          value === "shallow"
            ? "bg-yellow-500 text-white shadow-sm"
            : "text-gray-500 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
      >
        <Coffee className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Shallow</span>
      </button>
    </div>
  );
}

function TaskForm({ onSubmit, isLoading, categories = [] }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(5);
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [timeInteracted, setTimeInteracted] = useState(false);
  const [workType, setWorkType] = useState("shallow");
  const [category, setCategory] = useState("");

  const { isKeyboardVisible, viewportHeight, keyboardHeight } = useKeyboardAware();
  const { handleInputFocus, handleInputBlur, focusNextInput } = useInputFocus();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim() && priority >= 1 && priority <= 10) {
      const taskData = {
        title: title.trim(),
        priority: Number(priority),
        estimatedTime: timeInteracted ? Number(estimatedTime) : null,
        isFocus: false,
        workType: workType,
        category: category || null,
      };
      console.log('Submitting task with data:', taskData);
      onSubmit(taskData);
      setTitle("");
      setPriority(5);
      setEstimatedTime(30);
      setTimeInteracted(false);
      setWorkType("shallow");
      setCategory("");
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div
      className="w-full flex justify-center transition-all duration-300 ease-in-out"
      style={{
        transform: isKeyboardVisible ? 'translateY(-10px)' : 'translateY(0)',
        marginBottom: isKeyboardVisible ? '10px' : '0',
        minHeight: 'auto'
      }}
    >
      <form
        onSubmit={handleSubmit}
        className={`w-full bg-white dark:bg-black shadow-sm border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 sm:p-3 transition-all duration-300 ${
          isKeyboardVisible ? 'shadow-lg border-blue-300 dark:border-blue-600' : ''
        }`}
      >
          {/* Desktop: All Elements in One Line, Mobile: Stacked Layout */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-2.5 w-full">
            {/* Task Input - Full width on mobile, flexible on desktop */}
            <Input
              type="text"
              placeholder="What are you working on?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && title.trim()) {
                  handleSubmit(e);
                } else if (e.key === 'Tab') {
                  e.preventDefault();
                  focusNextInput();
                }
              }}
              className="w-full lg:flex-1 px-3 py-2 h-10 text-sm bg-white dark:bg-gray-900 text-black dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />

            {/* Work Type Toggle */}
            <WorkTypeToggle value={workType} onChange={setWorkType} />

            {/* Category Selector */}
            {categories.length > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <Folder className="h-3.5 w-3.5 text-gray-400" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="text-xs px-2 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="">No category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Mobile: Priority and Time in same row, Desktop: Separate */}
            <div className="flex flex-col sm:flex-row lg:flex-row gap-2 lg:gap-2 w-full lg:w-auto">
              {/* Priority Slider */}
              <div className="flex items-center gap-2 lg:min-w-[170px] p-1.5 rounded-lg transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 bg-gray-50/50 dark:bg-gray-900/50">
                <label className="text-xs font-semibold text-black dark:text-white whitespace-nowrap">
                  P: {priority}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value))}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      focusNextInput();
                    }
                  }}
                  className="slider flex-1 lg:w-20"
                />
              </div>

              {/* Time Slider — grayed out until user interacts */}
              <div className={`flex items-center gap-2 lg:min-w-[200px] p-1.5 rounded-lg transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 bg-gray-50/50 dark:bg-gray-900/50 ${
                !timeInteracted ? 'opacity-40' : ''
              }`}>
                <label className="text-xs font-semibold text-black dark:text-white whitespace-nowrap">
                  Time: {formatTime(estimatedTime)}
                </label>
                <input
                  type="range"
                  min="5"
                  max="180"
                  step="5"
                  value={estimatedTime}
                  onChange={(e) => {
                    setEstimatedTime(parseInt(e.target.value));
                    setTimeInteracted(true);
                  }}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  className="slider flex-1 lg:w-28"
                />
              </div>
            </div>

            {/* Add Button - Full width on mobile, auto width on desktop */}
            <Button
              type="submit"
              disabled={!title.trim() || isLoading}
              className="w-full lg:w-auto bg-black dark:bg-white text-white dark:text-black px-4 py-2 h-10 rounded-lg text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200 flex items-center justify-center space-x-1.5 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>{isLoading ? 'Adding...' : 'Add'}</span>
            </Button>
          </div>
        </form>
    </div>
  );
}

export { WorkTypeToggle };
export default TaskForm;
