import React from 'react';
import { Process } from '../../types/workflow';
import { ChevronDown, Plus } from 'lucide-react';

interface ProcessSelectorProps {
  processes: Process[];
  selectedProcess: Process | null;
  onProcessSelect: (process: Process) => void;
  onNewProcess?: () => void;
}

export const ProcessSelector: React.FC<ProcessSelectorProps> = ({
  processes,
  selectedProcess,
  onProcessSelect,
  onNewProcess
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 space-x-reverse bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors min-w-[200px]"
      >
        {selectedProcess ? (
          <>
            <div className={`w-4 h-4 ${selectedProcess.color} rounded`}></div>
            <span className="font-medium text-gray-900">{selectedProcess.name}</span>
          </>
        ) : (
          <span className="text-gray-500">اختر عملية</span>
        )}
        <ChevronDown className="w-4 h-4 text-gray-400 mr-auto" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[250px]">
            <div className="p-2">
              {processes.map((process) => (
                <button
                  key={process.id}
                  onClick={() => {
                    onProcessSelect(process);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center space-x-3 space-x-reverse p-3 rounded-lg hover:bg-gray-50 text-right transition-colors
                    ${selectedProcess?.id === process.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}
                  `}
                >
                  <div className={`w-4 h-4 ${process.color} rounded`}></div>
                  <div className="flex-1">
                    <div className="font-medium">{process.name}</div>
                    <div className="text-xs text-gray-500">{process.description}</div>
                  </div>
                </button>
              ))}
              
              {onNewProcess && (
                <>
                  <hr className="my-2" />
                  <button
                    onClick={() => {
                      onNewProcess();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 space-x-reverse p-3 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                  >
                    <div className="w-4 h-4 border-2 border-dashed border-gray-400 rounded flex items-center justify-center">
                      <Plus className="w-3 h-3" />
                    </div>
                    <span className="font-medium">عملية جديدة</span>
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