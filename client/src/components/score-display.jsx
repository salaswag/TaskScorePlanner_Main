import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Clock } from "lucide-react";

export default function ScoreDisplay({
  totalScore,
  totalPossibleScore,
  completedTasks,
  pendingTasks,
  totalEstimatedTime,
}) {
  const completionPercentage = totalPossibleScore > 0 
    ? Math.round((totalScore / totalPossibleScore) * 100) 
    : 0;

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Card className="bg-white dark:bg-black shadow-sm border border-gray-200 dark:border-gray-800">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Main Score */}
          <div className="text-center">
            <h3 className="text-base font-semibold text-black dark:text-white mb-1">
              Current Score
            </h3>
            <div className="text-2xl font-bold text-black dark:text-white">
              {totalScore} / {totalPossibleScore}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {completionPercentage}% Complete
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-black dark:bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-base font-semibold text-green-600 dark:text-green-400">
                {completedTasks.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Completed
              </div>
            </div>
            <div>
              <div className="text-base font-semibold text-orange-600 dark:text-orange-400">
                {pendingTasks.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Pending
              </div>
            </div>
            <div>
              <div className="text-base font-semibold text-blue-600 dark:text-blue-400">
                {formatTime(totalEstimatedTime)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Time Left
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}