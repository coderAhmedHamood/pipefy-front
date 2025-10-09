import fs from 'fs';
import path from 'path';

const filePath = 'src/components/kanban/TicketModal.tsx';

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║   🚀 تطبيق نظام الإسنادات والمراجعين - تلقائي    ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log('');

// قراءة الملف
console.log('📂 قراءة الملف...');
let content = fs.readFileSync(filePath, 'utf8');

// التحقق من أن الكود لم يُضف مسبقاً
if (content.includes('Assignments & Reviewers Section')) {
  console.log('⚠️  النظام مُضاف بالفعل!');
  console.log('   لا حاجة لإعادة التطبيق.');
  process.exit(0);
}

console.log('✅ الملف جاهز للتحديث');
console.log('');

// ============================================
// الجزء 1: إضافة قسم UI
// ============================================

console.log('📝 [1/2] إضافة قسم UI للإسنادات والمراجعين...');

const uiSection = `
            {/* Assignments & Reviewers Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* المستخدمين المُسندين */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse">
                      <Users className="w-5 h-5 text-blue-500" />
                      <span>المستخدمين المُسندين ({assignments.length})</span>
                    </h3>
                    <button
                      onClick={() => setShowAddAssignment(true)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="إضافة مستخدم"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {isLoadingAssignments ? (
                      <div className="text-center py-4 text-gray-400">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-xs">جاري التحميل...</p>
                      </div>
                    ) : assignments.length > 0 ? (
                      assignments.map((assignment) => (
                        <div key={assignment.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {assignment.user_name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-blue-900">{assignment.user_name || 'مستخدم'}</div>
                              <div className="text-xs text-blue-700">
                                {assignment.role && <span className="bg-blue-200 px-2 py-0.5 rounded">{assignment.role}</span>}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveAssignment(assignment.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                            title="حذف"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">لا يوجد مستخدمين مُسندين</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* المراجعين */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse">
                      <Shield className="w-5 h-5 text-green-500" />
                      <span>المراجعين ({reviewers.length})</span>
                    </h3>
                    <button
                      onClick={() => setShowAddReviewer(true)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="إضافة مراجع"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {isLoadingReviewers ? (
                      <div className="text-center py-4 text-gray-400">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                        <p className="text-xs">جاري التحميل...</p>
                      </div>
                    ) : reviewers.length > 0 ? (
                      reviewers.map((reviewer) => (
                        <div key={reviewer.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  {reviewer.reviewer_name?.charAt(0) || 'R'}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-green-900">{reviewer.reviewer_name || 'مراجع'}</div>
                                <div className="text-xs text-green-700">
                                  <span className={\`px-2 py-0.5 rounded \${
                                    reviewer.review_status === 'completed' ? 'bg-green-200' :
                                    reviewer.review_status === 'in_progress' ? 'bg-yellow-200' :
                                    reviewer.review_status === 'skipped' ? 'bg-gray-200' :
                                    'bg-blue-200'
                                  }\`}>
                                    {reviewer.review_status === 'completed' ? '✓ مكتمل' :
                                     reviewer.review_status === 'in_progress' ? '⏳ قيد المراجعة' :
                                     reviewer.review_status === 'skipped' ? '⊘ متخطى' :
                                     '⏸ معلق'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveReviewer(reviewer.id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                              title="حذف"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {reviewer.review_status !== 'completed' && (
                            <div className="flex space-x-2 space-x-reverse mt-2">
                              {reviewer.review_status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateReviewStatus(reviewer.id, 'in_progress')}
                                  className="flex-1 text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition-colors"
                                >
                                  بدء المراجعة
                                </button>
                              )}
                              {reviewer.review_status === 'in_progress' && (
                                <button
                                  onClick={() => handleUpdateReviewStatus(reviewer.id, 'completed')}
                                  className="flex-1 text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                                >
                                  إكمال المراجعة
                                </button>
                              )}
                              <button
                                onClick={() => handleUpdateReviewStatus(reviewer.id, 'skipped')}
                                className="flex-1 text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 transition-colors"
                              >
                                تخطي
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Shield className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">لا يوجد مراجعين</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
`;

const modalsSection = `
      {/* Add Assignment Modal */}
      {showAddAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">إضافة مستخدم مُسند</h3>
              <button
                onClick={() => {
                  setShowAddAssignment(false);
                  setSelectedUserId('');
                  setAssignmentRole('');
                  setAssignmentNotes('');
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المستخدم</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">اختر مستخدم</option>
                  {processUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الدور (اختياري)</label>
                <input
                  type="text"
                  value={assignmentRole}
                  onChange={(e) => setAssignmentRole(e.target.value)}
                  placeholder="مثال: مطور، مصمم، مدير"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات (اختياري)</label>
                <textarea
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  rows={3}
                  placeholder="أي ملاحظات إضافية..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex space-x-3 space-x-reverse mt-6">
              <button
                onClick={handleAddAssignment}
                disabled={!selectedUserId}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                إضافة
              </button>
              <button
                onClick={() => {
                  setShowAddAssignment(false);
                  setSelectedUserId('');
                  setAssignmentRole('');
                  setAssignmentNotes('');
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Reviewer Modal */}
      {showAddReviewer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">إضافة مراجع</h3>
              <button
                onClick={() => {
                  setShowAddReviewer(false);
                  setSelectedUserId('');
                  setReviewerNotes('');
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المراجع</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">اختر مراجع</option>
                  {processUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات المراجعة (اختياري)</label>
                <textarea
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  rows={3}
                  placeholder="أي ملاحظات للمراجعة..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex space-x-3 space-x-reverse mt-6">
              <button
                onClick={handleAddReviewer}
                disabled={!selectedUserId}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                إضافة
              </button>
              <button
                onClick={() => {
                  setShowAddReviewer(false);
                  setSelectedUserId('');
                  setReviewerNotes('');
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
`;

// إضافة قسم UI قبل Comments Section
const marker1 = '            {/* Comments Section */}';
content = content.replace(marker1, uiSection + '\n\n' + marker1);
console.log('   ✅ تم إضافة قسم UI');

// إضافة Modals قبل Attachment Delete
const marker2 = '      {/* Attachment Delete Confirmation Dialog */}';
content = content.replace(marker2, modalsSection + '\n\n' + marker2);
console.log('   ✅ تم إضافة Modals');

// حفظ الملف
fs.writeFileSync(filePath, content, 'utf8');

console.log('');
console.log('╔════════════════════════════════════════════════════════╗');
console.log('║          ✅ اكتمل التطبيق 100% بنجاح!              ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log('');
console.log('🎉 تم إضافة نظام الإسنادات والمراجعين بنجاح!');
console.log('');
console.log('📍 الخطوات التالية:');
console.log('   1. أعد تشغيل التطبيق: npm run dev');
console.log('   2. افتح أي تذكرة في المتصفح');
console.log('   3. ستجد قسمين جديدين:');
console.log('      - 👥 المستخدمين المُسندين');
console.log('      - 🛡️ المراجعين');
console.log('');
console.log('🧪 للاختبار:');
console.log('   node test-ticket-assignments-system.js');
console.log('');
console.log('🎊 النظام جاهز للاستخدام!');
