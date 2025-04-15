
import React from 'react';
import { Calendar, FileText, FilePlus, Pill, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TimelineItemType = {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'prescription' | 'lab' | 'visit' | 'medicine' | 'alert' | 'appointment';
  report_id?: string; // Added to link appointments to reports
};

interface TimelineItemProps {
  item: TimelineItemType;
  isLast?: boolean;
  onViewReport?: (reportId: string) => void;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ item, isLast = false, onViewReport }) => {
  const getIcon = () => {
    switch (item.type) {
      case 'prescription':
        return <FileText className="h-5 w-5 text-mediblue-600" />;
      case 'lab':
        return <FilePlus className="h-5 w-5 text-medigreen-600" />;
      case 'visit':
      case 'appointment':
        return <Calendar className="h-5 w-5 text-mediblue-500" />;
      case 'medicine':
        return <Pill className="h-5 w-5 text-secondary" />;
      case 'alert':
        return <AlertTriangle className="h-5 w-5 text-medired-500" />;
      default:
        return <Calendar className="h-5 w-5 text-mediblue-500" />;
    }
  };

  const getBgColor = () => {
    switch (item.type) {
      case 'prescription':
        return 'bg-mediblue-100 dark:bg-mediblue-900/30';
      case 'lab':
        return 'bg-medigreen-100 dark:bg-medigreen-900/30';
      case 'visit':
        return 'bg-mediblue-50 dark:bg-mediblue-800/30';
      case 'appointment':
        return 'bg-mediblue-50 dark:bg-mediblue-800/30';
      case 'medicine':
        return 'bg-secondary/20 dark:bg-secondary/10';
      case 'alert':
        return 'bg-medired-100 dark:bg-medired-900/30';
      default:
        return 'bg-mediblue-50 dark:bg-mediblue-800/30';
    }
  };

  return (
    <div className="flex gap-2 md:gap-4">
      {/* Line and Icon */}
      <div className="flex flex-col items-center">
        <div className={cn(
          "rounded-full p-1.5 md:p-2 z-10", 
          getBgColor()
        )}>
          {getIcon()}
        </div>
        {!isLast && (
          <div className="w-px bg-gray-200 dark:bg-gray-700 h-full" />
        )}
      </div>

      {/* Content */}
      <div className="pb-6 md:pb-8 w-full">
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-1">{item.date}</p>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-sm md:text-base">{item.title}</h3>
        <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm">{item.description}</p>
        <div className="mt-2 flex gap-2 flex-wrap">
          <span className={cn(
            "text-xs px-2 py-1 rounded-full", 
            getBgColor(), 
            item.type === 'alert' 
              ? 'text-medired-700 dark:text-medired-300' 
              : 'text-gray-700 dark:text-gray-300'
          )}>
            {item.type === 'appointment' ? 'Appointment' : item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </span>
          
          {/* Add report link if available */}
          {item.report_id && (
            <span 
              onClick={() => onViewReport && onViewReport(item.report_id!)}
              className="text-xs px-2 py-1 rounded-full bg-mediblue-100 dark:bg-mediblue-900/30 text-mediblue-700 dark:text-mediblue-300 cursor-pointer hover:bg-mediblue-200 dark:hover:bg-mediblue-800/30 transition-colors"
            >
              View Report
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimelineItem;
