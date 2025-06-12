import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function ScoreDisplay({ 
  totalScore, 
  completedTasks, 
  totalTasks, 
  pendingTasks, 
  totalEstimatedTime 
}) {
  const completedScore = completedTasks > 0 ? Math.round((totalScore / completedTasks) * 100) / 100 : 0;
  const maxPossibleScore = totalTasks > 0 ? Math.round((totalScore / completedTasks) * totalTasks) : 0;
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

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Tasks</span>
            <span className="text-xs font-semibold text-black dark:text-white">{completedTasks}/{totalTasks}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
