import { FRONTEND_BASE_URL } from '../config/config';

/**
 * دالة للحصول على الرابط الأساسي للتطبيق
 */
export const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`;
  }
  return FRONTEND_BASE_URL; // fallback from central config
};

/**
 * تحويل رابط التذكرة من action_url إلى رابط kanban
 * @param actionUrl - الرابط من الإشعار مثل "/tickets/ticket-id"
 * @returns الرابط الكامل للكانبان مثل "{FRONTEND_BASE_URL}/kanban?ticket=ticket-id"
 */
export const convertToKanbanUrl = (actionUrl: string): string => {
  if (!actionUrl) return '';
  
  // استخراج معرف التذكرة من الرابط
  const ticketIdMatch = actionUrl.match(/\/tickets\/([a-f0-9-]+)/i);
  if (!ticketIdMatch) return '';
  
  const ticketId = ticketIdMatch[1];
  const baseUrl = getBaseUrl();
  
  return `${baseUrl}/kanban?ticket=${ticketId}`;
};

/**
 * فتح رابط التذكرة في نافذة جديدة أو نفس النافذة
 * @param actionUrl - الرابط من الإشعار
 * @param openInNewTab - فتح في تبويب جديد (افتراضي: false)
 */
export const openTicketUrl = (actionUrl: string, openInNewTab: boolean = false): void => {
  const kanbanUrl = convertToKanbanUrl(actionUrl);
  if (!kanbanUrl) return;
  
  if (openInNewTab) {
    window.open(kanbanUrl, '_blank');
  } else {
    window.location.href = kanbanUrl;
  }
};

/**
 * التحقق من صحة رابط التذكرة
 * @param actionUrl - الرابط للتحقق منه
 * @returns true إذا كان الرابط صحيح
 */
export const isValidTicketUrl = (actionUrl: string): boolean => {
  if (!actionUrl) return false;
  return /\/tickets\/[a-f0-9-]+/i.test(actionUrl);
};
