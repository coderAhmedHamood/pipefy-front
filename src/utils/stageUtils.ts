import { Stage, Ticket } from '../types/workflow';

export const validateStageTransition = (
  fromStage: Stage,
  toStageId: string,
  ticket: Ticket
): { isValid: boolean; reason?: string } => {
  // التحقق من وجود المرحلة المستهدفة في القائمة المسموحة
  if (!fromStage.allowed_transitions?.includes(toStageId)) {
    return {
      isValid: false,
      reason: `لا يمكن الانتقال من "${fromStage.name}" إلى المرحلة المحددة`
    };
  }

  // التحقق من الشروط الإضافية (يمكن إضافة المزيد حسب الحاجة)
  if (fromStage.required_permissions && fromStage.required_permissions.length > 0) {
    // التحقق من الصلاحيات (سيتم تطبيقه في Backend)
  }

  return { isValid: true };
};

export const getNextAllowedStages = (
  currentStageId: string,
  stages: Stage[]
): Stage[] => {
  const currentStage = stages.find(s => s.id === currentStageId);
  if (!currentStage || !currentStage.allowed_transitions) {
    return [];
  }

  return stages.filter(stage => 
    currentStage.allowed_transitions!.includes(stage.id)
  );
};

export const sortStagesByPriority = (stages: Stage[]): Stage[] => {
  return [...stages].sort((a, b) => a.priority - b.priority);
};

export const getStageTransitionPath = (
  fromStageId: string,
  toStageId: string,
  stages: Stage[]
): Stage[] => {
  // خوارزمية بسيطة للعثور على المسار بين المراحل
  const visited = new Set<string>();
  const path: Stage[] = [];
  
  const findPath = (currentId: string, targetId: string): boolean => {
    if (currentId === targetId) {
      const stage = stages.find(s => s.id === currentId);
      if (stage) path.push(stage);
      return true;
    }
    
    if (visited.has(currentId)) return false;
    visited.add(currentId);
    
    const currentStage = stages.find(s => s.id === currentId);
    if (!currentStage || !currentStage.allowed_transitions) return false;
    
    for (const nextStageId of currentStage.allowed_transitions) {
      if (findPath(nextStageId, targetId)) {
        path.unshift(currentStage);
        return true;
      }
    }
    
    return false;
  };
  
  findPath(fromStageId, toStageId);
  return path;
};

export const canSkipToStage = (
  fromStageId: string,
  toStageId: string,
  stages: Stage[]
): boolean => {
  const fromStage = stages.find(s => s.id === fromStageId);
  const toStage = stages.find(s => s.id === toStageId);
  
  if (!fromStage || !toStage) return false;
  
  // السماح بالتخطي إذا كانت المرحلة المستهدفة لها أولوية أعلى
  // أو إذا كانت في قائمة الانتقالات المسموحة
  return fromStage.allowed_transitions?.includes(toStageId) || false;
};

export const getStageStatistics = (
  stageId: string,
  tickets: Ticket[]
): {
  totalTickets: number;
  averageTimeInStage: number;
  overdueTickets: number;
} => {
  const stageTickets = tickets.filter(t => t.current_stage_id === stageId);
  const overdueTickets = stageTickets.filter(t => 
    t.due_date && new Date(t.due_date) < new Date()
  ).length;
  
  // حساب متوسط الوقت في المرحلة (تقريبي)
  const averageTime = stageTickets.length > 0 
    ? stageTickets.reduce((sum, ticket) => {
        const created = new Date(ticket.created_at);
        const updated = new Date(ticket.updated_at);
        return sum + (updated.getTime() - created.getTime());
      }, 0) / stageTickets.length / (1000 * 60 * 60) // بالساعات
    : 0;

  return {
    totalTickets: stageTickets.length,
    averageTimeInStage: Math.round(averageTime),
    overdueTickets
  };
};