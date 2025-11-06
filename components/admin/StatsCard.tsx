interface StatsCardProps {
  title: string;
  value: number | string;
  icon: string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  link?: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  description,
  trend,
  link,
}: StatsCardProps) {
  const CardContent = (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
          {trend && (
            <div className="mt-2 flex items-center">
              <span
                className={`text-sm font-medium ${
                  trend.isPositive
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                vs last period
              </span>
            </div>
          )}
        </div>
        <div className="text-4xl opacity-50">{icon}</div>
      </div>
    </div>
  );

  if (link) {
    return (
      <a href={link} className="block">
        {CardContent}
      </a>
    );
  }

  return CardContent;
}
