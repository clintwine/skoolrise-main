import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, Download, Mail, CheckSquare, X, 
  FileSpreadsheet, FileText, MoreHorizontal 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

export default function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  onDelete,
  onExportCSV,
  onExportPDF,
  onSendEmail,
  onBulkUpdate,
  customActions = [],
  entityName = 'items',
}) {
  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="bg-gray-900 text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3 pr-4 border-r border-gray-700">
            <Badge className="bg-blue-600 text-white text-lg px-3 py-1">
              {selectedCount}
            </Badge>
            <span className="text-gray-300">{entityName} selected</span>
          </div>

          <div className="flex items-center gap-2">
            {onExportCSV && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onExportCSV}
                className="text-white hover:bg-gray-800"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                CSV
              </Button>
            )}

            {onExportPDF && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onExportPDF}
                className="text-white hover:bg-gray-800"
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
            )}

            {onSendEmail && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSendEmail}
                className="text-white hover:bg-gray-800"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            )}

            {customActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800">
                    <MoreHorizontal className="w-4 h-4 mr-2" />
                    More
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {customActions.map((action, idx) => (
                    <DropdownMenuItem key={idx} onClick={action.onClick}>
                      {action.icon && <action.icon className="w-4 h-4 mr-2" />}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {onDelete && (
              <>
                <div className="w-px h-6 bg-gray-700 mx-2" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="text-red-400 hover:bg-red-900/30 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClearSelection}
            className="text-gray-400 hover:text-white hover:bg-gray-800 ml-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}