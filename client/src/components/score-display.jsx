import { Card, CardContent } from "@/components/ui/card";

export default function ScoreDisplay({
  totalScore,
  totalPossibleScore,
  totalEstimatedTime,
}) {
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const percentage = totalPossibleScore > 0 ? Math.round((totalScore / totalPossibleScore) * 100) : 0;

  // Determine color based on percentage
  const getScoreColor = (percent) => {
    if (percent >= 80) return "text-green-600 dark:text-green-400";
    if (percent >= 60) return "text-yellow-600 dark:text-yellow-400";
    if (percent >= 40) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const scoreColor = getScoreColor(percentage);

  return (
    <Card className="bg-white dark:bg-black shadow-sm border border-gray-200 dark:border-gray-800">
      <CardContent className="p-2 h-full flex items-center justify-center">
        <div className="flex items-center justify-center divide-x divide-gray-300 dark:divide-gray-600">
          {/* Score Fraction */}
          <div className="text-center px-4">
            <div className={`text-lg font-bold ${scoreColor}`}>
              {totalScore} / {totalPossibleScore}
            </div>
          </div>

          {/* Percentage */}
          <div className="text-center px-4">
            <div className={`text-lg font-bold ${scoreColor}`}>
              {percentage}%
            </div>
          </div>

          {/* Time Left */}
          <div className="text-center px-4">
            <div className="text-sm font-medium text-black dark:text-white">
              {formatTime(totalEstimatedTime)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Time Left
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}