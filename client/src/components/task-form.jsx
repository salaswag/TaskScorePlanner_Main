import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";

export default function TaskForm({ onSubmit, isLoading }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("5");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [isLater, setIsLater] = useState(false);
  const [isFocus, setIsFocus] = useState(false);
  const { user } = useAuth();

  const isAnonymous = !user || user.isAnonymous;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim() && priority >= 1 && priority <= 10 && estimatedTime > 0) {
      const taskData = {
        title: title.trim(),
        priority: Number(priority),
        estimatedTime: Number(estimatedTime),
        isFocus: false,
      };
      console.log('Submitting task with data:', taskData);
      onSubmit(taskData);
      setTitle("");
      setPriority("5");
      setEstimatedTime("");
      setIsLater(false);
      setIsFocus(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium">Add New Task</CardTitle>
      </CardHeader>
      <CardContent>
        {isAnonymous && (
          <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Your tasks are not saved permanently. Sign in to save your tasks across sessions.
            </AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="estimatedTime">Estimated Time (minutes)</Label>
            <Input
              type="number"
              id="estimatedTime"
              placeholder="Enter estimated time"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isLater"
              checked={isLater}
              onCheckedChange={setIsLater}
            />
            <label
              htmlFor="isLater"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Is Later
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isFocus"
              checked={isFocus}
              onCheckedChange={setIsFocus}
            />
            <label
              htmlFor="isFocus"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Is Focus
            </label>
          </div>
          <Button disabled={!title.trim() || isLoading}>
            {isLoading ? "Adding..." : "Add Task"}
            <PlusCircle className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}