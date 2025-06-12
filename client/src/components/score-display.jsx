import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function ScoreDisplay({ 
  totalScore, 
  completedTasks, 
  totalTasks, 
  pendingTasks, 
  totalEstimatedTime 
}) {
  const hours = Math.floor(totalEstimatedTime / 60);
  const minutes = totalEstimatedTime % 60;
  const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <BarChart3 className="h-5 w-5 text-black" />
          <h2 className="text-lg font-semibold text-black">Your Score</h2>
        </div>
        
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-black mb-2">{totalScore}</div>
          <p className="text-sm text-gray-600">Priority Points Earned</p>
          <p className="text-xs text-gray-500 mt-1">{pendingTasks} points remaining</p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Tasks</span>
            <span className="text-sm font-semibold">{completedTasks}/{totalTasks}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Priority Score</span>
            <span className="text-sm font-semibold">{totalScore}/{totalScore + pendingTasks}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Time Efficiency</span>
            <span className="text-sm font-semibold">{timeStr}</span>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {totalEstimatedTime > 0 ? `${pendingTasks} tasks estimated` : 'No estimates'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
