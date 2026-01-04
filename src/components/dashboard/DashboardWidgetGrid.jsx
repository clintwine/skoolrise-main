import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, GripVertical, Plus, X, Eye, EyeOff,
  Users, DollarSign, CheckSquare, TrendingUp, BookOpen,
  Award, Calendar, AlertTriangle, Brain, Bell
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const AVAILABLE_WIDGETS = [
  { id: 'students', name: 'Student Stats', icon: Users, defaultEnabled: true },
  { id: 'financial', name: 'Financial Summary', icon: DollarSign, defaultEnabled: true },
  { id: 'attendance', name: 'Attendance Overview', icon: CheckSquare, defaultEnabled: true },
  { id: 'performance', name: 'Performance Chart', icon: TrendingUp, defaultEnabled: true },
  { id: 'ai-insights', name: 'AI Insights', icon: Brain, defaultEnabled: true },
  { id: 'at-risk', name: 'At-Risk Students', icon: AlertTriangle, defaultEnabled: true },
  { id: 'upcoming', name: 'Upcoming Events', icon: Calendar, defaultEnabled: false },
  { id: 'quick-actions', name: 'Quick Actions', icon: Award, defaultEnabled: true },
  { id: 'notifications', name: 'Recent Notifications', icon: Bell, defaultEnabled: false },
  { id: 'classes', name: 'Class Overview', icon: BookOpen, defaultEnabled: false },
];

export default function DashboardWidgetGrid({ children, onLayoutChange }) {
  const [configOpen, setConfigOpen] = useState(false);
  const [widgets, setWidgets] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    loadSavedLayout();
  }, []);

  const loadSavedLayout = async () => {
    try {
      const user = await base44.auth.me();
      const savedLayout = user.dashboard_layout;
      
      if (savedLayout) {
        setWidgets(JSON.parse(savedLayout));
      } else {
        // Default layout
        setWidgets(AVAILABLE_WIDGETS.filter(w => w.defaultEnabled).map((w, idx) => ({
          ...w,
          enabled: true,
          order: idx,
        })));
      }
    } catch (e) {
      setWidgets(AVAILABLE_WIDGETS.filter(w => w.defaultEnabled).map((w, idx) => ({
        ...w,
        enabled: true,
        order: idx,
      })));
    }
  };

  const saveLayout = async (newWidgets) => {
    try {
      await base44.auth.updateMe({ 
        dashboard_layout: JSON.stringify(newWidgets) 
      });
    } catch (e) {
      console.error('Failed to save layout:', e);
    }
  };

  const toggleWidget = (widgetId) => {
    const existing = widgets.find(w => w.id === widgetId);
    let newWidgets;
    
    if (existing) {
      newWidgets = widgets.map(w => 
        w.id === widgetId ? { ...w, enabled: !w.enabled } : w
      );
    } else {
      const widget = AVAILABLE_WIDGETS.find(w => w.id === widgetId);
      newWidgets = [...widgets, { ...widget, enabled: true, order: widgets.length }];
    }
    
    setWidgets(newWidgets);
    saveLayout(newWidgets);
    if (onLayoutChange) onLayoutChange(newWidgets);
  };

  const handleDragEnd = (result) => {
    setIsDragging(false);
    if (!result.destination) return;
    
    const items = Array.from(widgets.filter(w => w.enabled));
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const newWidgets = widgets.map(w => {
      const newOrder = items.findIndex(i => i.id === w.id);
      return newOrder >= 0 ? { ...w, order: newOrder } : w;
    });
    
    setWidgets(newWidgets);
    saveLayout(newWidgets);
    if (onLayoutChange) onLayoutChange(newWidgets);
  };

  const enabledWidgets = widgets
    .filter(w => w.enabled)
    .sort((a, b) => a.order - b.order);

  const isWidgetEnabled = (widgetId) => {
    const widget = widgets.find(w => w.id === widgetId);
    return widget ? widget.enabled : AVAILABLE_WIDGETS.find(w => w.id === widgetId)?.defaultEnabled;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setConfigOpen(true)}
          className="text-gray-600"
        >
          <Settings className="w-4 h-4 mr-2" />
          Customize Dashboard
        </Button>
      </div>

      {children({ enabledWidgets, isWidgetEnabled })}

      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Customize Dashboard
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Choose which widgets to display and drag to reorder them.
            </p>
            
            <div className="space-y-2">
              {AVAILABLE_WIDGETS.map((widget) => {
                const Icon = widget.icon;
                const isEnabled = isWidgetEnabled(widget.id);
                
                return (
                  <div 
                    key={widget.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isEnabled ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isEnabled ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <Icon className={`w-4 h-4 ${isEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
                      </div>
                      <span className={`font-medium ${isEnabled ? 'text-gray-900' : 'text-gray-500'}`}>
                        {widget.name}
                      </span>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => toggleWidget(widget.id)}
                    />
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t flex justify-end">
              <Button onClick={() => setConfigOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}