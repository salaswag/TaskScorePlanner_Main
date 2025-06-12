
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Clock } from "lucide-react";

export default function ScoreDisplay({ 
  totalScore, 
  completedTasks, 
  totalTasks, 
  pendingTasks, 
  totalEstimatedTime 
}) {
  // Calculate the maximum possible score from all tasks
  const allTasks = [...(completedTasks || []), ...(pendingTasks || [])];
  const maxPossibleScore = allTasks.reduce((sum, task) => sum + (task.priority || 0), 0);
  const scorePercentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Card className="bg-white dark:bg-black shadow-sm border border-gray-200 dark:border-gray-800">
      <CardContent className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="h-4 w-4 text-black dark:text-white" />
          <h2 className="text-base font-semibold text-black dark:text-white">Score</h2>
        </div>
        
        <div className="text-center mb-4">
          <div className="text-2xl font-bold text-black dark:text-white mb-1">{totalScore}</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Priority Points: {totalScore}/{maxPossibleScore} ({scorePercentage}%)
          </p>
        </div>

        {totalEstimatedTime > 0 && (
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center space-x-2">
              <Clock className="h-4 w-4 text-black dark:text-white" />
              <div className="text-sm font-medium text-black dark:text-white">
                Est Time: {formatTime(totalEstimatedTime)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
