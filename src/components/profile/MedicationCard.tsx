
import React from 'react';
import { Calendar, Clock, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useMedications } from '@/hooks/use-medications';
import { format } from 'date-fns';

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  instructions: string;
  isActive: boolean;
};

interface MedicationCardProps {
  medication: Medication;
}

const MedicationCard: React.FC<MedicationCardProps> = ({ medication }) => {
  const { updateMedication, deleteMedication } = useMedications();

  const handleToggleStatus = () => {
    updateMedication(medication.id, {
      is_active: !medication.isActive
    });
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${medication.name}?`)) {
      deleteMedication(medication.id);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '';
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow-md",
      !medication.isActive && "opacity-60"
    )}>
      <div className={cn(
        "h-2 w-full",
        medication.isActive ? "bg-medigreen-500" : "bg-gray-300"
      )} />
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-gray-900">{medication.name}</h3>
            <p className="text-sm text-gray-500">{medication.dosage}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={cn(
              "text-xs px-2 py-1 rounded-full",
              medication.isActive 
                ? "bg-medigreen-100 text-medigreen-700" 
                : "bg-gray-100 text-gray-700"
            )}>
              {medication.isActive ? 'Active' : 'Inactive'}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleToggleStatus}>
                  {medication.isActive ? 'Mark as Inactive' : 'Mark as Active'}
                </DropdownMenuItem>
                <DropdownMenuItem>Edit Details</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-600"
                  onClick={handleDelete}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="mt-3 space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2 text-mediblue-500" />
            {medication.frequency}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2 text-mediblue-500" />
            {formatDate(medication.startDate)}
            {medication.endDate && ` - ${formatDate(medication.endDate)}`}
          </div>
        </div>

        {medication.instructions && (
          <div className="mt-3 text-sm bg-blue-50 p-2 rounded">
            <span className="font-medium">Instructions: </span>
            {medication.instructions}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MedicationCard;
