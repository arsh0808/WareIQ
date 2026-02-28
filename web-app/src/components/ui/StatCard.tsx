import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from './Card';
import { cn } from '@/lib/utils/cn';
import { Skeleton } from './Skeleton';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  loading?: boolean;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

const colorMap = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  loading = false,
  color = 'blue',
}) => {
  return (
    <Card className="p-6 hover:shadow-xl transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          {loading ? (
            <Skeleton className="h-8 w-24 mb-2" />
          ) : (
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {value}
            </h3>
          )}
          {trend && !loading && (
            <div className="flex items-center gap-1">
              <span className={cn(
                'text-sm font-medium',
                trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', colorMap[color])}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );
};
