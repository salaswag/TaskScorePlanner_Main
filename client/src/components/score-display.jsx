
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

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

  return (
    <Card className="bg-white dark:bg-black shadow-sm border border-gray-200 dark:border-gray-800">
      <CardContent className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="h-4 w-4 text-black dark:text-white" />
          <h2 className="text-base font-semibold text-black dark:text-white">Score</h2>
        </div>
        
        <div className="text-center mb-4">
          <div className="text-2xl font-bold text-black dark:text-white mb-1">{totalScore}</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Priority Points ({scorePercentage}%)</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-black dark:text-white">{completedTasks?.length || 0}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Completed</p>
          </div>
          <div>
            <div className="text-lg font-semibold text-black dark:text-white">{pendingTasks?.length || 0}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Pending</p>
          </div>
        </div>

        {totalEstimatedTime > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Remaining: {Math.floor(totalEstimatedTime / 60)}h {totalEstimatedTime % 60}m
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
