# سكريبت لإضافة Modals للإسنادات والمراجعين إلى TicketModal.tsx

$filePath = "src\components\kanban\TicketModal.tsx"

Write-Host "🚀 بدء إضافة Modals..." -ForegroundColor Green

# قراءة الملف
$content = Get-Content $filePath -Raw -Encoding UTF8

# التحقق من أن الكود لم يُضف مسبقاً
if ($content -match "Add Assignment Modal") {
    Write-Host "⚠️  Modals موجودة بالفعل!" -ForegroundColor Yellow
    exit
}

# الكود المراد إضافته
$modalsCode = @"

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
"@

# استبدال النص
$marker = "      {/* Attachment Delete Confirmation Dialog */}"
$replacement = $modalsCode + "`n`n" + $marker

$newContent = $content -replace [regex]::Escape($marker), $replacement

# حفظ الملف
$newContent | Set-Content $filePath -Encoding UTF8 -NoNewline

Write-Host "✅ تم إضافة Modals بنجاح!" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 اكتمل التطبيق 100%!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 الآن:" -ForegroundColor Cyan
Write-Host "   1. أعد تشغيل التطبيق (npm run dev)" -ForegroundColor Yellow
Write-Host "   2. افتح أي تذكرة" -ForegroundColor Yellow
Write-Host "   3. ستجد قسم المستخدمين المُسندين والمراجعين!" -ForegroundColor Yellow
