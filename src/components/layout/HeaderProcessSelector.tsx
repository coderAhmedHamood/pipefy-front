import React from 'react';
import { Process } from '../../types/workflow';
import { ChevronDown, Plus, Building2 } from 'lucide-react';

interface HeaderProcessSelectorProps {
  processes: Process[];
  selectedProcess: Process | null;
  onProcessSelect: (process: Process) => void;
  onNewProcess?: () => void;
  compact?: boolean;
}

export const HeaderProcessSelector: React.FC<HeaderProcessSelectorProps> = ({
  processes,
  selectedProcess,
  onProcessSelect,
  onNewProcess,
  compact = false
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center space-x-2 space-x-reverse bg-white border border-gray-200 rounded-lg px-3 py-2 
          hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm
          ${compact ? 'min-w-[180px]' : 'min-w-[220px]'}
        `}
      >
        <Building2 className="w-4 h-4 text-gray-500" />
        
        {selectedProcess ? (
          <>
            <div className={`w-3 h-3 ${selectedProcess.color} rounded`}></div>
            <span className={`font-medium text-gray-900 truncate ${compact ? 'max-w-[100px]' : 'max-w-[140px]'}`}>
              {selectedProcess.name}
            </span>
          </>
        ) : (
          <span className="text-gray-500 text-sm">اختر عملية</span>
        )}
        
        <ChevronDown className={`w-4 h-4 text-gray-400 mr-auto transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[280px] max-h-[400px] overflow-y-auto">
            <div className="p-2">
              {/* عنوان القائمة */}
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-2">
                العمليات المتاحة ({processes.length})
              </div>

              {/* قائمة العمليات */}
              {processes.length > 0 ? (
                processes.map((process) => (
                  <button
                    key={process.id}
                    onClick={() => {
                      onProcessSelect(process);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full flex items-center space-x-3 space-x-reverse p-3 rounded-lg hover:bg-gray-50 text-right transition-colors
                      ${selectedProcess?.id === process.id ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-gray-700'}
                    `}
                  >
                    <div className={`w-4 h-4 ${process.color} rounded flex-shrink-0`}></div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${selectedProcess?.id === process.id ? 'text-blue-700' : 'text-gray-900'}`}>
                        {process.name}
                      </div>
                      {process.description && (
                        <div className="text-xs text-gray-500 truncate mt-0.5">
                          {process.description}
                        </div>
                      )}
                      <div className="flex items-center space-x-2 space-x-reverse mt-1">
                        <span className="text-xs text-gray-400">
                          {process.stages?.length || 0} مرحلة
                        </span>
                        {process.tickets_count !== undefined && (
                          <>
                            <span className="text-xs text-gray-300">•</span>
                            <span className="text-xs text-gray-400">
                              {process.tickets_count} تذكرة
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {selectedProcess?.id === process.id && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">لا توجد عمليات متاحة</p>
                </div>
              )}
              
              {/* زر إنشاء عملية جديدة */}
              {onNewProcess && (
                <>
                  <hr className="my-2" />
                  <button
                    onClick={() => {
                      onNewProcess();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 space-x-reverse p-3 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors border-2 border-dashed border-gray-200 hover:border-gray-300"
                  >
                    <div className="w-4 h-4 border-2 border-dashed border-gray-400 rounded flex items-center justify-center">
                      <Plus className="w-3 h-3" />
                    </div>
                    <span className="font-medium">إنشاء عملية جديدة</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
