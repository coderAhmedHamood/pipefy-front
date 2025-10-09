# سكريبت لإضافة قسم الإسنادات والمراجعين إلى TicketModal.tsx

$filePath = "src\components\kanban\TicketModal.tsx"

Write-Host "🚀 بدء إضافة قسم الإسنادات والمراجعين..." -ForegroundColor Green

# قراءة الملف
$content = Get-Content $filePath -Raw -Encoding UTF8

# التحقق من أن الكود لم يُضف مسبقاً
if ($content -match "Assignments & Reviewers Section") {
    Write-Host "⚠️  القسم موجود بالفعل!" -ForegroundColor Yellow
    exit
}

# الكود المراد إضافته
$uiCode = @"

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
                                  <span className={`px-2 py-0.5 rounded ${'$'}{
                                    reviewer.review_status === 'completed' ? 'bg-green-200' :
                                    reviewer.review_status === 'in_progress' ? 'bg-yellow-200' :
                                    reviewer.review_status === 'skipped' ? 'bg-gray-200' :
                                    'bg-blue-200'
                                  }`}>
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
"@

# استبدال النص
$marker = "            {/* Comments Section */}"
$replacement = $uiCode + "`n`n" + $marker

$newContent = $content -replace [regex]::Escape($marker), $replacement

# حفظ الملف
$newContent | Set-Content $filePath -Encoding UTF8 -NoNewline

Write-Host "✅ تم إضافة قسم UI بنجاح!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 الآن قم بتشغيل السكريبت الثاني:" -ForegroundColor Cyan
Write-Host "   .\add-assignments-modals.ps1" -ForegroundColor Yellow
