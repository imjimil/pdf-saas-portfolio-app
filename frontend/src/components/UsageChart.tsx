import { useEffect, useState } from 'react';
import { analyticsAPI } from '../services/api';

interface DailyUsage {
  date: string;
  fileCount: number;
  totalSize: number;
}

interface UsageChartProps {
  days?: number;
}

const UsageChart = ({ days = 30 }: UsageChartProps) => {
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsage();
  }, [days]);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await analyticsAPI.getUsage(days);
      setDailyUsage(data.dailyUsage || []);
    } catch (err: any) {
      console.error('Error fetching usage:', err);
      setError(err.response?.data?.message || 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-primary"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Loading chart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600 dark:text-red-400">{error}</div>
    );
  }

  if (dailyUsage.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        No usage data available for the selected period.
      </div>
    );
  }

  // Calculate max values for scaling
  const maxFiles = Math.max(...dailyUsage.map((d) => d.fileCount), 1);
  const maxSize = Math.max(...dailyUsage.map((d) => d.totalSize), 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Usage Over Time ({days} days)
      </h3>
      
      <div className="space-y-4">
        {/* Files Processed Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Files Processed
          </h4>
          <div className="flex items-end gap-1 h-32">
            {dailyUsage.map((day, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center group relative"
              >
                <div
                  className="w-full bg-green-primary dark:bg-green-light rounded-t transition-all hover:opacity-80"
                  style={{
                    height: `${(day.fileCount / maxFiles) * 100}%`,
                    minHeight: day.fileCount > 0 ? '4px' : '0',
                  }}
                  title={`${day.date}: ${day.fileCount} files`}
                />
                {index % Math.ceil(dailyUsage.length / 10) === 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                    {formatDate(day.date)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Storage Used Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Storage Used
          </h4>
          <div className="flex items-end gap-1 h-32">
            {dailyUsage.map((day, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center group relative"
              >
                <div
                  className="w-full bg-blue-500 dark:bg-blue-400 rounded-t transition-all hover:opacity-80"
                  style={{
                    height: `${(day.totalSize / maxSize) * 100}%`,
                    minHeight: day.totalSize > 0 ? '4px' : '0',
                  }}
                  title={`${day.date}: ${formatFileSize(day.totalSize)}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Files</div>
            <div className="text-xl font-bold text-green-primary dark:text-green-light">
              {dailyUsage.reduce((sum, d) => sum + d.fileCount, 0)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Storage</div>
            <div className="text-xl font-bold text-blue-500 dark:text-blue-400">
              {formatFileSize(dailyUsage.reduce((sum, d) => sum + d.totalSize, 0))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageChart;

