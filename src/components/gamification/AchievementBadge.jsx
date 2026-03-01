import React from 'react';
import { Trophy, Star, Target, Flame, BookOpen, Award, Heart, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const iconMap = {
  trophy: Trophy,
  star: Star,
  target: Target,
  flame: Flame,
  book: BookOpen,
  award: Award,
  heart: Heart,
  zap: Zap,
};

const colorMap = {
  gold: 'from-yellow-400 to-yellow-600 border-yellow-300',
  silver: 'from-gray-300 to-gray-500 border-gray-200',
  bronze: 'from-amber-500 to-amber-700 border-amber-400',
  blue: 'from-blue-400 to-blue-600 border-blue-300',
  green: 'from-green-400 to-green-600 border-green-300',
  purple: 'from-purple-400 to-purple-600 border-purple-300',
  red: 'from-red-400 to-red-600 border-red-300',
};

export default function AchievementBadge({ 
  achievement, 
  isUnlocked = false, 
  progress = 0, 
  size = 'md' 
}) {
  const Icon = iconMap[achievement?.icon] || Award;
  const colorClass = colorMap[achievement?.color] || colorMap.blue;
  
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="relative">
            <div
              className={`
                ${sizeClasses[size]} rounded-full border-2 flex items-center justify-center
                ${isUnlocked 
                  ? `bg-gradient-to-br ${colorClass} shadow-lg` 
                  : 'bg-gray-200 border-gray-300'
                }
                transition-all duration-300 hover:scale-110
              `}
            >
              <Icon 
                className={`${iconSizes[size]} ${isUnlocked ? 'text-white' : 'text-gray-400'}`} 
              />
            </div>
            
            {!isUnlocked && progress > 0 && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                <div className="bg-white rounded-full px-1.5 py-0.5 text-xs font-medium text-gray-600 shadow-sm border">
                  {Math.round(progress)}%
                </div>
              </div>
            )}
            
            {isUnlocked && (
              <div className="absolute -top-1 -right-1">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-semibold">{achievement?.name}</p>
            <p className="text-xs text-gray-400">{achievement?.description}</p>
            {!isUnlocked && (
              <p className="text-xs text-blue-400 mt-1">
                Progress: {Math.round(progress)}%
              </p>
            )}
            {achievement?.points_reward > 0 && (
              <p className="text-xs text-yellow-500 mt-1">
                +{achievement.points_reward} points
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}