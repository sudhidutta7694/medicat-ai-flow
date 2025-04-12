
import React from 'react';
import { Calendar, FileText, FilePlus, Pills, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TimelineItemType = {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'prescription' | 'lab' | 'visit' | 'medicine' | 'alert';
};

interface TimelineItemProps {
  item: TimelineItemType;
  isLast?: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ item, isLast = false }) => {
  const getIcon = () => {
    switch (item.type) {
      case 'prescription':
        return <FileText className="h-5 w-5 text-mediblue-600" />;
      case 'lab':
        return <FilePlus className="h-5 w-5 text-medigreen-600" />;
      case 'visit':
        return <Calendar className="h-5 w-5 text-mediblue-500" />;
      case 'medicine':
        return <Pills className="h-5 w-5 text-secondary" />;
      case 'alert':
        return <AlertTriangle className="h-5 w-5 text-medired-500" />;
      default:
        return <Calendar className="h-5 w-5 text-mediblue-500" />;
    }
  };

  const getBgColor = () => {
    switch (item.type) {
      case 'prescription':
        return 'bg-mediblue-100';
      case 'lab':
        return 'bg-medigreen-100';
      case 'visit':
        return 'bg-mediblue-50';
      case 'medicine':
        return 'bg-secondary/20';
      case 'alert':
        return 'bg-medired-100';
      default:
        return 'bg-mediblue-50';
    }
  };

  return (
    <div className="flex gap-4">
      {/* Line and Icon */}
      <div className="flex flex-col items-center">
        <div className={cn(
          "rounded-full p-2 z-10", 
          getBgColor()
        )}>
          {getIcon()}
        </div>
        {!isLast && (
          <div className="w-px bg-gray-200 h-full" />
        )}
      </div>

      {/* Content */}
      <div className="pb-8 w-full">
        <p className="text-sm text-gray-500 mb-1">{item.date}</p>
        <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
        <p className="text-gray-600 text-sm">{item.description}</p>
        <div className="mt-2 flex gap-2 flex-wrap">
          <span className={cn(
            "text-xs px-2 py-1 rounded-full", 
            getBgColor(), 
            item.type === 'alert' ? 'text-medired-700' : 'text-gray-700'
          )}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimelineItem;
