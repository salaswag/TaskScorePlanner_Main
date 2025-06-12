import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Clock } from "lucide-react";

export default function ScoreDisplay({ totalScore, completedTasks, totalTasks, pendingTasks, totalEstimatedTime }) {
  const completedCount = completedTasks?.length || 0;
  const pendingCount = (pendingTasks || []).length;
  const allTasks = [...(pendingTasks || []), ...(completedTasks || [])];
  const totalPossibleScore = allTasks.reduce((sum, task) => sum + (task.priority || 0), 0);
  const scorePercentage = totalPossibleScore > 0 ? Math.round((totalScore / totalPossibleScore) * 100) : 0;

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Card className="bg-white dark:bg-black shadow-sm border border-gray-200 dark:border-gray-800">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Priority Points</h3>
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="text-2xl font-bold text-black dark:text-white">
                {totalScore}/{totalPossibleScore}
              </div>
              <div className="text-4xl font-bold text-black dark:text-white">
                {scorePercentage}%
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
              <span>Est. Time Left</span>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{formatTime(totalEstimatedTime)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}