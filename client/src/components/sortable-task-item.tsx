import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckSquare, Calendar, Clock, AlertTriangle, GripVertical } from "lucide-react";
import type { Task } from "@shared/schema";

interface SortableTaskItemProps {
  task: Task;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
  onToggleStatus: (taskId: number, newStatus: string) => void;
}

export function SortableTaskItem({ 
  task, 
  getPriorityColor, 
  getStatusColor, 
  onToggleStatus 
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`hover:shadow-lg transition-shadow ${isDragging ? 'rotate-3 scale-105' : ''}`}
    >
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <div 
          className="cursor-grab active:cursor-grabbing mr-2 text-gray-400 hover:text-gray-600"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="flex items-center space-x-2 flex-1">
          <Checkbox
            checked={task.status === "completed"}
            onCheckedChange={(checked) => {
              onToggleStatus(task.id, checked ? "completed" : "pending");
            }}
          />
          <CardTitle className={`text-lg ${task.status === "completed" ? "line-through text-gray-500" : ""}`}>
            {task.title}
          </CardTitle>
        </div>
        <div className="flex space-x-2">
          <Badge className={getPriorityColor(task.priority || "medium")}>
            {task.priority}
          </Badge>
          <Badge className={getStatusColor(task.status || "pending")}>
            {task.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {task.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
          )}
          {task.type && (
            <div className="flex items-center text-sm text-gray-500">
              <CheckSquare className="h-4 w-4 mr-2" />
              {task.type}
            </div>
          )}
          {task.dueDate && (
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-2" />
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </div>
          )}
          {task.relatedTo && (
            <div className="text-sm text-blue-600">
              Related to: {task.relatedTo}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}