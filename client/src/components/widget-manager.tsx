import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DragDropContext, 
  Droppable, 
  Draggable,
  DropResult
} from "@hello-pangea/dnd";
import { 
  Settings, 
  Eye, 
  EyeOff, 
  Move, 
  Plus,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Brain,
  Activity
} from "lucide-react";

interface Widget {
  id: string;
  title: string;
  type: string;
  visible: boolean;
  position: number;
  size: 'small' | 'medium' | 'large';
  data?: any;
}

interface WidgetManagerProps {
  widgets: Widget[];
  onWidgetUpdate: (widgets: Widget[]) => void;
}

export function WidgetManager({ widgets, onWidgetUpdate }: WidgetManagerProps) {
  const [editMode, setEditMode] = useState(false);
  const [availableWidgets, setAvailableWidgets] = useState([
    {
      id: 'predictive-behavior',
      title: 'Predictive Behavior Insights',
      type: 'behavior',
      icon: Brain,
      description: 'AI-powered behavior predictions and patterns'
    },
    {
      id: 'performance-metrics',
      title: 'Personal Performance',
      type: 'performance',
      icon: TrendingUp,
      description: 'Your performance vs team averages'
    },
    {
      id: 'revenue-opportunities',
      title: 'Revenue Opportunities',
      type: 'opportunity',
      icon: Target,
      description: 'AI-identified sales opportunities'
    },
    {
      id: 'activity-predictions',
      title: 'Activity Predictions',
      type: 'activity',
      icon: Activity,
      description: 'Upcoming week forecast and recommendations'
    }
  ]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newWidgets = Array.from(widgets);
    const [reorderedWidget] = newWidgets.splice(result.source.index, 1);
    newWidgets.splice(result.destination.index, 0, reorderedWidget);

    // Update positions
    const updatedWidgets = newWidgets.map((widget, index) => ({
      ...widget,
      position: index
    }));

    onWidgetUpdate(updatedWidgets);
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    const updatedWidgets = widgets.map(widget =>
      widget.id === widgetId
        ? { ...widget, visible: !widget.visible }
        : widget
    );
    onWidgetUpdate(updatedWidgets);
  };

  const addWidget = (widgetType: any) => {
    const newWidget: Widget = {
      id: `${widgetType.id}_${Date.now()}`,
      title: widgetType.title,
      type: widgetType.type,
      visible: true,
      position: widgets.length,
      size: 'medium'
    };

    onWidgetUpdate([...widgets, newWidget]);
  };

  const removeWidget = (widgetId: string) => {
    const updatedWidgets = widgets
      .filter(widget => widget.id !== widgetId)
      .map((widget, index) => ({ ...widget, position: index }));
    
    onWidgetUpdate(updatedWidgets);
  };

  if (!editMode) {
    return (
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <Button
          variant="outline"
          onClick={() => setEditMode(true)}
          className="flex items-center space-x-2"
        >
          <Settings className="h-4 w-4" />
          <span>Customize Dashboard</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Customize Dashboard</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setEditMode(false)}
          >
            Done
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Widgets */}
        <Card>
          <CardHeader>
            <CardTitle>Active Widgets</CardTitle>
          </CardHeader>
          <CardContent>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="widgets">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {widgets.map((widget, index) => (
                      <Draggable key={widget.id} draggableId={widget.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`border rounded-lg p-3 bg-white ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div {...provided.dragHandleProps}>
                                  <Move className="h-4 w-4 text-gray-400 cursor-move" />
                                </div>
                                <span className="font-medium">{widget.title}</span>
                                <Badge variant={widget.visible ? "default" : "secondary"}>
                                  {widget.type}
                                </Badge>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleWidgetVisibility(widget.id)}
                                >
                                  {widget.visible ? (
                                    <Eye className="h-4 w-4" />
                                  ) : (
                                    <EyeOff className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeWidget(widget.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  ×
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </CardContent>
        </Card>

        {/* Available Widgets */}
        <Card>
          <CardHeader>
            <CardTitle>Available Widgets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableWidgets.map((widget) => {
                const IconComponent = widget.icon;
                const isAdded = widgets.some(w => w.type === widget.type);
                
                return (
                  <div key={widget.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <IconComponent className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium">{widget.title}</div>
                          <div className="text-sm text-gray-500">{widget.description}</div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addWidget(widget)}
                        disabled={isAdded}
                        variant={isAdded ? "secondary" : "default"}
                      >
                        {isAdded ? "Added" : <Plus className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function useWidgetManager() {
  const [widgets, setWidgets] = useState<Widget[]>([
    {
      id: 'predictive-behavior-1',
      title: 'Predictive Behavior Insights',
      type: 'behavior',
      visible: true,
      position: 0,
      size: 'medium'
    },
    {
      id: 'performance-metrics-1',
      title: 'Personal Performance',
      type: 'performance',
      visible: true,
      position: 1,
      size: 'medium'
    },
    {
      id: 'revenue-opportunities-1',
      title: 'Revenue Opportunities',
      type: 'opportunity',
      visible: true,
      position: 2,
      size: 'medium'
    },
    {
      id: 'activity-predictions-1',
      title: 'Activity Predictions',
      type: 'activity',
      visible: true,
      position: 3,
      size: 'medium'
    }
  ]);

  const updateWidgets = (newWidgets: Widget[]) => {
    setWidgets(newWidgets);
    // Save to localStorage for persistence
    localStorage.setItem('dashboard-widgets', JSON.stringify(newWidgets));
  };

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-widgets');
    if (saved) {
      try {
        setWidgets(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved widgets:', error);
      }
    }
  }, []);

  return {
    widgets: widgets.filter(w => w.visible).sort((a, b) => a.position - b.position),
    allWidgets: widgets,
    updateWidgets
  };
}