import React, { createContext, useContext, useState, useEffect } from 'react';
import { Process, Ticket, User } from '../types/workflow';
import { useAuth } from './AuthContext';

interface WorkflowContextType {
  processes: Process[];
  selectedProcess: Process | null;
  setSelectedProcess: (process: Process | null) => void;
  clearSelectedProcess: () => void;
  createTicket: (ticketData: Partial<Ticket>) => Promise<void>;
  updateTicket: (ticketId: string, updates: Partial<Ticket>) => Promise<void>;
  moveTicket: (ticketId: string, toStageId: string) => Promise<void>;
  deleteTicket: (ticketId: string) => Promise<void>;
  loading: boolean;
  getProcessUsers: (processId: string) => User[];
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};

// Mock data for processes
const mockProcesses: Process[] = [
  {
    id: 'process-1',
    name: 'دعم العملاء',
    description: 'عملية دعم العملاء والاستفسارات',
    color: 'bg-blue-500',
    stages: [
      {
        id: 'stage-1',
        name: 'جديد',
        description: 'طلبات جديدة',
        color: 'bg-gray-500',
        order_index: 1,
        is_initial: true,
        is_final: false,
        allowed_transitions: ['stage-2'],
        process_id: 'process-1'
      },
      {
        id: 'stage-2',
        name: 'قيد المراجعة',
        description: 'تحت المراجعة',
        color: 'bg-yellow-500',
        order_index: 2,
        is_initial: false,
        is_final: false,
        allowed_transitions: ['stage-3', 'stage-4'],
        process_id: 'process-1'
      },
      {
        id: 'stage-3',
        name: 'مكتمل',
        description: 'تم الانتهاء',
        color: 'bg-green-500',
        order_index: 3,
        is_initial: false,
        is_final: true,
        allowed_transitions: [],
        process_id: 'process-1'
      }
    ],
    fields: [
      {
        id: 'customer_name',
        name: 'اسم العميل',
        type: 'text',
        is_required: true,
        options: []
      },
      {
        id: 'customer_email',
        name: 'البريد الإلكتروني',
        type: 'email',
        is_required: true,
        options: []
      },
      {
        id: 'issue_type',
        name: 'نوع المشكلة',
        type: 'select',
        is_required: true,
        options: [
          { id: '1', label: 'مشكلة تقنية', value: 'technical' },
          { id: '2', label: 'استفسار عام', value: 'general' },
          { id: '3', label: 'طلب دعم', value: 'support' }
        ]
      }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'أحمد محمد',
    email: 'ahmed@example.com',
    role: {
      id: 'role-1',
      name: 'مطور',
      description: 'مطور تطبيقات',
      permissions: [],
      is_system_role: false
    },
    permissions: [],
    created_at: new Date().toISOString(),
    is_active: true
  },
  {
    id: 'user-2',
    name: 'فاطمة علي',
    email: 'fatima@example.com',
    role: {
      id: 'role-2',
      name: 'مراجع',
      description: 'مراجع المحتوى',
      permissions: [],
      is_system_role: false
    },
    permissions: [],
    created_at: new Date().toISOString(),
    is_active: true
  }
];

export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [processes] = useState<Process[]>(mockProcesses);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Auto-select first process on load
  useEffect(() => {
    if (processes.length > 0 && !selectedProcess) {
      const savedProcessId = localStorage.getItem('selectedProcessId');
      const processToSelect = savedProcessId 
        ? processes.find(p => p.id === savedProcessId) || processes[0]
        : processes[0];
      setSelectedProcess(processToSelect);
    }
  }, [processes, selectedProcess]);

  // Save selected process to localStorage
  useEffect(() => {
    if (selectedProcess) {
      localStorage.setItem('selectedProcessId', selectedProcess.id);
    }
  }, [selectedProcess]);

  const clearSelectedProcess = () => {
    setSelectedProcess(null);
    localStorage.removeItem('selectedProcessId');
  };

  const createTicket = async (ticketData: Partial<Ticket>) => {
    console.log('Creating ticket:', ticketData);
    // This would normally call the API
    // For now, just simulate success
    return Promise.resolve();
  };

  const updateTicket = async (ticketId: string, updates: Partial<Ticket>) => {
    console.log('Updating ticket:', ticketId, updates);
    // This would normally call the API
    return Promise.resolve();
  };

  const moveTicket = async (ticketId: string, toStageId: string) => {
    console.log('Moving ticket:', ticketId, 'to stage:', toStageId);
    // This would normally call the API
    return Promise.resolve();
  };

  const deleteTicket = async (ticketId: string) => {
    console.log('Deleting ticket:', ticketId);
    // This would normally call the API
    return Promise.resolve();
  };

  const getProcessUsers = (processId: string): User[] => {
    return mockUsers;
  };

  const value: WorkflowContextType = {
    processes,
    selectedProcess,
    setSelectedProcess,
    clearSelectedProcess,
    createTicket,
    updateTicket,
    moveTicket,
    deleteTicket,
    loading,
    getProcessUsers
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};
