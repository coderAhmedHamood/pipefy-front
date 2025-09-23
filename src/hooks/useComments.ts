import { useState, useEffect, useCallback } from 'react';
import commentService, { Comment, CreateCommentData, CommentListParams, CommentsResponse } from '../services/commentService';

interface UseCommentsReturn {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  pagination: CommentsResponse['pagination'] | null;
  ticketInfo: CommentsResponse['ticket_info'] | null;
  loadComments: (params?: CommentListParams) => Promise<void>;
  addComment: (commentData: CreateCommentData) => Promise<Comment | null>;
  updateComment: (commentId: string, commentData: Partial<CreateCommentData>) => Promise<Comment | null>;
  deleteComment: (commentId: string) => Promise<boolean>;
  refreshComments: () => Promise<void>;
}

export const useComments = (ticketId: string): UseCommentsReturn => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<CommentsResponse['pagination'] | null>(null);
  const [ticketInfo, setTicketInfo] = useState<CommentsResponse['ticket_info'] | null>(null);

  const loadComments = useCallback(async (params?: CommentListParams) => {
    if (!ticketId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await commentService.getTicketComments(ticketId, params);
      
      if (response.success) {
        setComments(response.data || []);
        setPagination(response.pagination);
        setTicketInfo(response.ticket_info);
      } else {
        setError('فشل في جلب التعليقات');
      }
    } catch (err) {
      console.error('خطأ في جلب التعليقات:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب التعليقات');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  const addComment = useCallback(async (commentData: CreateCommentData): Promise<Comment | null> => {
    if (!ticketId) return null;

    try {
      const response = await commentService.createComment(ticketId, commentData);
      
      if (response.success && response.data) {
        // إضافة التعليق الجديد إلى بداية القائمة
        setComments(prev => [response.data, ...prev]);
        return response.data;
      } else {
        setError(response.message || 'فشل في إضافة التعليق');
        return null;
      }
    } catch (err) {
      console.error('خطأ في إضافة التعليق:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء إضافة التعليق');
      return null;
    }
  }, [ticketId]);

  const updateComment = useCallback(async (commentId: string, commentData: Partial<CreateCommentData>): Promise<Comment | null> => {
    try {
      const response = await commentService.updateComment(commentId, commentData);
      
      if (response.success && response.data) {
        // تحديث التعليق في القائمة
        setComments(prev => prev.map(comment => 
          comment.id === commentId ? response.data : comment
        ));
        return response.data;
      } else {
        setError(response.message || 'فشل في تحديث التعليق');
        return null;
      }
    } catch (err) {
      console.error('خطأ في تحديث التعليق:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحديث التعليق');
      return null;
    }
  }, []);

  const deleteComment = useCallback(async (commentId: string): Promise<boolean> => {
    try {
      const response = await commentService.deleteComment(commentId);
      
      if (response.success) {
        // إزالة التعليق من القائمة
        setComments(prev => prev.filter(comment => comment.id !== commentId));
        return true;
      } else {
        setError(response.message || 'فشل في حذف التعليق');
        return false;
      }
    } catch (err) {
      console.error('خطأ في حذف التعليق:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء حذف التعليق');
      return false;
    }
  }, []);

  const refreshComments = useCallback(async () => {
    await loadComments();
  }, [loadComments]);

  // تحميل التعليقات عند تغيير ticketId
  useEffect(() => {
    if (ticketId) {
      loadComments();
    }
  }, [ticketId, loadComments]);

  return {
    comments,
    loading,
    error,
    pagination,
    ticketInfo,
    loadComments,
    addComment,
    updateComment,
    deleteComment,
    refreshComments
  };
};
