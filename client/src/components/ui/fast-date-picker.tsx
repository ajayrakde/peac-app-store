import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface FastDatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
}

export const FastDatePicker: React.FC<FastDatePickerProps> = ({
  value,
  onChange,
  placeholder = "Select date",
  minYear = 1950,
  maxYear = new Date().getFullYear() - 14,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"day" | "month" | "year">("day");
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      return new Date(value);
    }
    return new Date(maxYear, 0, 1);
  });

  const selectedDate = value ? new Date(value) : null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange(formatDate(newDate));
    setIsOpen(false);
  };

  const handleMonthSelect = (month: number) => {
    setViewDate(new Date(viewDate.getFullYear(), month, 1));
    setViewMode("day");
  };

  const handleYearSelect = (year: number) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
    setViewMode("month");
  };

  const navigateMonth = (direction: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + direction, 1));
  };

  const navigateYear = (direction: number) => {
    setViewDate(new Date(viewDate.getFullYear() + direction, viewDate.getMonth(), 1));
  };

  const renderDayView = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9" />);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === month && 
        selectedDate.getFullYear() === year;
      
      days.push(
        <Button
          key={day}
          variant={isSelected ? "default" : "ghost"}
          size="sm"
          className="h-9 w-9 p-0"
          onClick={() => handleDateSelect(day)}
        >
          {day}
        </Button>
      );
    }

    return (
      <div className="p-3">
        <div className="text-xs text-center text-muted-foreground mb-2">
          Click month or year to change quickly
        </div>
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="sm" onClick={() => navigateMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setViewMode("month");
              }}
              className="font-medium hover:bg-primary hover:text-primary-foreground text-sm px-3 py-1 h-auto min-w-[90px] border-dashed cursor-pointer"
              type="button"
            >
              {viewDate.toLocaleDateString('en-US', { month: 'long' })} ▼
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setViewMode("year");
              }}
              className="font-medium hover:bg-primary hover:text-primary-foreground text-sm px-3 py-1 h-auto min-w-[70px] border-dashed cursor-pointer"
              type="button"
            >
              {viewDate.getFullYear()} ▼
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigateMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="h-9 flex items-center justify-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    return (
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="sm" onClick={() => navigateYear(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("year")}
            className="font-medium"
          >
            {viewDate.getFullYear()}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigateYear(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {months.map((month, index) => {
            const isSelected = selectedDate &&
              selectedDate.getMonth() === index &&
              selectedDate.getFullYear() === viewDate.getFullYear();
            
            return (
              <Button
                key={month}
                variant={isSelected ? "default" : "ghost"}
                size="sm"
                className="h-9"
                onClick={() => handleMonthSelect(index)}
              >
                {month}
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    const currentYear = viewDate.getFullYear();
    const startYear = Math.floor(currentYear / 12) * 12;
    const years = [];
    
    for (let i = 0; i < 12; i++) {
      const year = startYear + i;
      if (year >= minYear && year <= maxYear) {
        years.push(year);
      }
    }

    return (
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="sm" onClick={() => {
            const newStartYear = startYear - 12;
            setViewDate(new Date(newStartYear, viewDate.getMonth(), 1));
          }}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-medium">
            {startYear} - {startYear + 11}
          </div>
          <Button variant="ghost" size="sm" onClick={() => {
            const newStartYear = startYear + 12;
            setViewDate(new Date(newStartYear, viewDate.getMonth(), 1));
          }}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {years.map((year) => {
            const isSelected = selectedDate && selectedDate.getFullYear() === year;
            
            return (
              <Button
                key={year}
                variant={isSelected ? "default" : "ghost"}
                size="sm"
                className="h-9"
                onClick={() => handleYearSelect(year)}
              >
                {year}
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  const displayValue = selectedDate 
    ? selectedDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    : "";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          type="button"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
          onClick={() => setIsOpen(true)}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {displayValue || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 bg-white border shadow-lg" 
        align="start" 
        side="bottom"
        sideOffset={4}
        avoidCollisions={true}
        collisionPadding={8}
      >
        <div className="min-w-[300px] max-w-[350px]">
          {viewMode === "day" && renderDayView()}
          {viewMode === "month" && renderMonthView()}
          {viewMode === "year" && renderYearView()}
        </div>
      </PopoverContent>
    </Popover>
  );
};