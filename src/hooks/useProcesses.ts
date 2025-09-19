import { useState, useEffect, useCallback } from 'react';
import { Process } from '../types/workflow';
import { processService, ProcessListParams, ProcessStats } from '../services/processService';
import { mockProcessService } from '../services/mockProcessService';
import { ApiError } from '../lib/api';

// استخدام API الحقيقي
const apiService = processService;

interface UseProcessesState {
  processes: Process[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  } | null;
  stats: ProcessStats | null;
}

interface UseProcessesActions {
  fetchProcesses: (params?: ProcessListParams) => Promise<void>;
  fetchProcessStats: () => Promise<void>;
  refreshProcesses: () => Promise<void>;
  searchProcesses: (query: string) => Promise<void>;
  createProcess: (processData: Partial<Process>) => Promise<boolean>;
  clearError: () => void;
}

export interface UseProcessesReturn extends UseProcessesState, UseProcessesActions {}

export const useProcesses = (initialParams?: ProcessListParams): UseProcessesReturn => {
  const [state, setState] = useState<UseProcessesState>({
    processes: [],
    loading: false,
    error: null,
    pagination: null,
    stats: null,
  });

  const [currentParams, setCurrentParams] = useState<ProcessListParams>(
    initialParams || { page: 1, per_page: 10 }
  );

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const fetchProcesses = useCallback(async (params?: ProcessListParams) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const finalParams = params || currentParams;
      setCurrentParams(finalParams);
      
      const response = await apiService.getProcesses(finalParams);
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          processes: response.data || [],
          pagination: response.pagination,
          loading: false,
        }));
      } else {
        throw new Error(response.message || 'فشل في جلب العمليات');
      }
    } catch (error) {
      const apiError = error as ApiError;
      setState(prev => ({
        ...prev,
        loading: false,
        error: apiError.message || 'حدث خطأ أثناء جلب العمليات',
      }));
    }
  }, [currentParams]);

  const fetchProcessStats = useCallback(async () => {
    try {
      const response = await apiService.getProcessStats();
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          stats: response.data,
        }));
      }
    } catch (error) {
      const apiError = error as ApiError;
      console.error('خطأ في جلب إحصائيات العمليات:', apiError.message);
    }
  }, []);

  const refreshProcesses = useCallback(async () => {
    await fetchProcesses(currentParams);
  }, [fetchProcesses, currentParams]);

  const searchProcesses = useCallback(async (query: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      if (!query.trim()) {
        await fetchProcesses(currentParams);
        return;
      }

      const response = await apiService.searchProcesses(query);

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          processes: response.data || [],
          pagination: null, // البحث لا يحتوي على pagination
          loading: false,
        }));
      } else {
        throw new Error(response.message || 'فشل في البحث');
      }
    } catch (error) {
      const apiError = error as ApiError;
      setState(prev => ({
        ...prev,
        loading: false,
        error: apiError.message || 'حدث خطأ أثناء البحث',
      }));
    }
  }, [fetchProcesses, currentParams]);

  const createProcess = useCallback(async (processData: Partial<Process>): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiService.createProcess(processData);

      if (response.success) {
        // تحديث قائمة العمليات والإحصائيات
        await Promise.all([
          fetchProcesses(currentParams),
          fetchProcessStats()
        ]);

        setState(prev => ({ ...prev, loading: false }));
        return true;
      } else {
        throw new Error(response.message || 'فشل في إنشاء العملية');
      }
    } catch (error) {
      const apiError = error as ApiError;
      setState(prev => ({
        ...prev,
        loading: false,
        error: apiError.message || 'حدث خطأ أثناء إنشاء العملية',
      }));
      return false;
    }
  }, [currentParams, fetchProcesses, fetchProcessStats]);

  // جلب العمليات عند تحميل المكون
  useEffect(() => {
    fetchProcesses();
  }, []);

  return {
    ...state,
    fetchProcesses,
    fetchProcessStats,
    refreshProcesses,
    searchProcesses,
    createProcess,
    clearError,
  };
};

export default useProcesses;
