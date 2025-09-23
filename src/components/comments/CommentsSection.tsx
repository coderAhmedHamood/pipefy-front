import React, { useState } from 'react';
import { MessageSquare, Plus, Clock, User, Loader2, Edit2, Trash2, Save, X } from 'lucide-react';
import { useComments } from '../../hooks/useComments';
import { Comment } from '../../services/commentService';

interface CommentsSectionProps {
  ticketId: string;
  onCommentAdded?: (comment: Comment) => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ 
  ticketId, 
  onCommentAdded 
}) => {
  const {
    comments,
    loading,
    error,
    addComment,
    updateComment,
    deleteComment,
    refreshComments
  } = useComments(ticketId);

  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const handleAddComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const comment = await addComment({
        content: newComment.trim(),
        is_internal: false
      });

      if (comment) {
        setNewComment('');
        setIsAddingComment(false);
        onCommentAdded?.(comment);
      }
    } catch (error) {
      console.error('خطأ في إضافة التعليق:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editingContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateComment(commentId, {
        content: editingContent.trim()
      });
      setEditingCommentId(null);
      setEditingContent('');
    } catch (error) {
      console.error('خطأ في تحديث التعليق:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) return;

    setIsSubmitting(true);
    try {
      await deleteComment(commentId);
    } catch (error) {
      console.error('خطأ في حذف التعليق:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n.charAt(0)).join('').toUpperCase() || 'U';
  };

  if (loading && comments.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="mr-2 text-gray-500">جاري تحميل التعليقات...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 space-x-reverse">
          <MessageSquare className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            التعليقات ({comments.length})
          </h3>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={refreshComments}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 p-1 rounded"
            title="تحديث التعليقات"
          >
            <Clock className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => setIsAddingComment(true)}
            className="text-purple-600 hover:text-purple-700 flex items-center space-x-1 space-x-reverse text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة تعليق</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Add Comment Form */}
      {isAddingComment && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            placeholder="اكتب تعليقك هنا..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-end space-x-2 space-x-reverse mt-3">
            <button
              onClick={() => {
                setIsAddingComment(false);
                setNewComment('');
              }}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
            >
              إلغاء
            </button>
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim() || isSubmitting}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center space-x-1 space-x-reverse"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>إضافة</span>
            </button>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start space-x-3 space-x-reverse">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">
                  {getInitials(comment.author_name)}
                </span>
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    {comment.author_name}
                  </span>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.created_at)}
                    </span>
                    {/* أزرار التحديث والحذف */}
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <button
                        type="button"
                        onClick={() => handleEditComment(comment)}
                        disabled={isSubmitting || editingCommentId === comment.id}
                        className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors"
                        title="تعديل التعليق"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={isSubmitting}
                        className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                        title="حذف التعليق"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {editingCommentId === comment.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={3}
                      placeholder="تعديل التعليق..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                      disabled={isSubmitting}
                    />
                    <div className="flex items-center justify-end space-x-2 space-x-reverse">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={isSubmitting}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
                      >
                        إلغاء
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(comment.id)}
                        disabled={!editingContent.trim() || isSubmitting}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center space-x-1 space-x-reverse"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>حفظ...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3 h-3" />
                            <span>حفظ</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>
                )}

                {comment.is_internal && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      تعليق داخلي
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm">لا توجد تعليقات بعد</p>
            <p className="text-xs mt-1">كن أول من يضيف تعليقاً</p>
          </div>
        )}
      </div>
    </div>
  );
};
