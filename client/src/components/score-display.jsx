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

  return (
    <Card className="bg-white dark:bg-black shadow-sm border border-gray-200 dark:border-gray-800">
      <CardContent className="p-3">
        <div className="text-center space-y-2">
          {/* Main Score */}
          <div className="text-xl font-bold text-black dark:text-white">
            {totalScore} / {totalPossibleScore}
          </div>
          
          {/* Time Left */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Time Left: {formatTime(totalEstimatedTime)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}