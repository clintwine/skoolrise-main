import React from 'react';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function MobileTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="mb-4 -mx-4 px-4">
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                    isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  );
}