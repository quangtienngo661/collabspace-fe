import { cn } from "@/app/components/ui/utils";
import { formatDueDate, dueDateStatus, timeAgo } from "@/app/utils/format";

interface DateDisplayProps {
  date: string | null | undefined;
  format: "relative" | "absolute" | "due";
  className?: string;
}

export function DateDisplay({ date, format, className }: DateDisplayProps) {
  if (!date) return <span className={cn("text-slate-400", className)}>—</span>;

  const dateObj = new Date(date);
  if (Number.isNaN(dateObj.getTime())) {
    return <span className={cn("text-slate-400", className)}>Invalid Date</span>;
  }

  const absoluteString = dateObj.toLocaleString("en-US");

  if (format === "relative") {
    return (
      <span title={absoluteString} className={className}>
        {timeAgo(date)}
      </span>
    );
  }

  if (format === "due") {
    const status = dueDateStatus(date);
    const dueText = formatDueDate(date);
    
    let colorClass = "text-slate-500";
    if (status === "overdue") colorClass = "text-red-600 font-medium";
    else if (status === "today") colorClass = "text-amber-600 font-medium";
    else if (status === "soon") colorClass = "text-blue-600";
    else if (status === "normal") colorClass = "text-slate-500";

    return (
      <span title={absoluteString} className={cn(colorClass, className)}>
        {dueText}
      </span>
    );
  }

  // format === "absolute"
  return (
    <span title={absoluteString} className={className}>
      {dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}
    </span>
  );
}
