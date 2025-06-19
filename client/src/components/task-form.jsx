import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Plus, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function TaskForm({ onTaskSubmit, isLater = false }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState([5]);
  const [estimatedTime, setEstimatedTime] = useState([30]);
  const [isFocus, setIsFocus] = useState(false);

  const isAnonymous = !user || user.isAnonymous;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Task</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onTaskSubmit({
              title,
              description,
              priority: priority[0],
              estimatedTime: estimatedTime[0],
              isFocus,
              isLater,
            });
            setTitle('');
            setDescription('');
            setPriority([5]);
            setEstimatedTime([30]);
            setIsFocus(false);
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description"
            />
          </div>
          <div>
            <Label>Priority: {priority[0]}</Label>
            <Slider
              value={priority}
              onValueChange={setPriority}
              defaultValue={[5]}
              max={10}
              step={1}
            />
          </div>
          <div>
            <Label>Estimated Time: {estimatedTime[0]} minutes</Label>
            <Slider
              value={estimatedTime}
              onValueChange={setEstimatedTime}
              defaultValue={[30]}
              max={120}
              step={5}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="isFocus" checked={isFocus} onCheckedChange={setIsFocus} />
            <Label htmlFor="isFocus">Focus Task</Label>
          </div>
          <Button type="submit" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add {isLater ? 'Later' : ''} Task
          </Button>

          {isAnonymous && (
            <Alert className="mt-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> Your tasks are stored temporarily and will be lost when you close the browser. Sign in to save your tasks permanently.
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
}