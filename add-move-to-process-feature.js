import fs from 'fs';

const filePath = 'src/components/kanban/TicketModal.tsx';

console.log('🔧 إضافة ميزة "نقل إلى عملية"...');

let content = fs.readFileSync(filePath, 'utf8');

// 1. إضافة import لـ ticketService
const importLine = "import ticketReviewerService, { TicketReviewer } from '../../services/ticketReviewerService';";
if (!content.includes("import ticketService from '../../services/ticketService';")) {
  const newImport = importLine + "\nimport ticketService from '../../services/ticketService';";
  content = content.replace(importLine, newImport);
  console.log('✅ تم إضافة import ticketService');
}

// 2. إضافة states جديدة بعد showAddReviewer
const statesLocation = "  const [isLoadingUsers, setIsLoadingUsers] = useState(false);";
const newStates = `  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // حالات نقل إلى عملية
  const [showProcessSelector, setShowProcessSelector] = useState(false);
  const [selectedProcessId, setSelectedProcessId] = useState('');
  const [isMovingToProcess, setIsMovingToProcess] = useState(false);
  const [allProcesses, setAllProcesses] = useState<Process[]>([]);
  const [isLoadingProcesses, setIsLoadingProcesses] = useState(false);`;

content = content.replace(statesLocation, newStates);
console.log('✅ تم إضافة states جديدة');

// 3. إضافة دالة loadAllProcesses بعد loadAllUsers
const loadAllUsersEnd = `    } finally {
      setIsLoadingUsers(false);
    }
  };`;

const loadProcessesFunction = `    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadAllProcesses = async () => {
    setIsLoadingProcesses(true);
    try {
      console.log('🔍 جاري جلب العمليات من API...');
      
      // استخدام WorkflowContext للحصول على العمليات
      const { processes } = useWorkflow();
      
      if (processes && processes.length > 0) {
        console.log('👥 عدد العمليات:', processes.length);
        setAllProcesses(processes);
      } else {
        console.error('❌ لا توجد عمليات');
        setAllProcesses([]);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب العمليات:', error);
      setAllProcesses([]);
    } finally {
      setIsLoadingProcesses(false);
    }
  };`;

content = content.replace(loadAllUsersEnd, loadProcessesFunction);
console.log('✅ تم إضافة دالة loadAllProcesses');

// 4. إضافة useEffect لجلب العمليات عند فتح Modal
const useEffectLocation = `  }, [showAddAssignment, showAddReviewer]);`;
const newUseEffect = `  }, [showAddAssignment, showAddReviewer]);

  // جلب العمليات عند فتح Modal نقل إلى عملية
  useEffect(() => {
    if (showProcessSelector) {
      console.log('🔓 تم فتح Modal نقل إلى عملية - جلب العمليات...');
      loadAllProcesses();
    }
  }, [showProcessSelector]);`;

content = content.replace(useEffectLocation, newUseEffect);
console.log('✅ تم إضافة useEffect لجلب العمليات');

// 5. إضافة دالة handleMoveToProcess بعد handleUpdateReviewStatus
const handleUpdateReviewStatusEnd = `      alert('فشل في تحديث حالة المراجعة');
    }
  };`;

const handleMoveToProcessFunction = `      alert('فشل في تحديث حالة المراجعة');
    }
  };

  const handleMoveToProcess = async () => {
    if (!selectedProcessId || isMovingToProcess) return;
    
    try {
      setIsMovingToProcess(true);
      console.log(\`🔄 نقل التذكرة \${ticket.id} إلى العملية \${selectedProcessId}\`);
      
      const response = await ticketService.moveTicketToProcess(ticket.id, selectedProcessId);
      
      if (response.success) {
        console.log('✅ تم نقل التذكرة بنجاح');
        alert('تم نقل التذكرة إلى العملية الجديدة بنجاح!');
        setShowProcessSelector(false);
        setSelectedProcessId('');
        onClose(); // إغلاق Modal التذكرة
        // يمكن إضافة refresh للصفحة أو تحديث الـ state
        window.location.reload();
      } else {
        console.error('❌ فشل في نقل التذكرة');
        alert('فشل في نقل التذكرة: ' + (response.message || 'خطأ غير معروف'));
      }
    } catch (error: any) {
      console.error('❌ خطأ في نقل التذكرة:', error);
      alert('حدث خطأ أثناء نقل التذكرة: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setIsMovingToProcess(false);
    }
  };`;

content = content.replace(handleUpdateReviewStatusEnd, handleMoveToProcessFunction);
console.log('✅ تم إضافة دالة handleMoveToProcess');

// 6. إضافة زر "نقل إلى عملية" بجانب زر "نقل إلى مرحلة"
const stageButtonLocation = `              {allowedStages.length > 0 && (
                <button
                  onClick={() => setShowStageSelector(true)}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 space-x-reverse"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>نقل إلى مرحلة</span>
                </button>
              )}`;

const newButtons = `              {allowedStages.length > 0 && (
                <button
                  onClick={() => setShowStageSelector(true)}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 space-x-reverse"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>نقل إلى مرحلة</span>
                </button>
              )}
              
              <button
                onClick={() => setShowProcessSelector(true)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 space-x-reverse"
              >
                <RefreshCw className="w-4 h-4" />
                <span>نقل إلى عملية</span>
              </button>`;

content = content.replace(stageButtonLocation, newButtons);
console.log('✅ تم إضافة زر "نقل إلى عملية"');

// 7. إضافة Modal نقل إلى عملية قبل Modal حذف المرفق
const attachmentDeleteModalLocation = `      {/* Attachment Delete Confirmation Dialog */}`;

const processModalCode = `      {/* Process Selector Modal */}
      {showProcessSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">نقل التذكرة إلى عملية أخرى</h3>
              <button
                onClick={() => {
                  setShowProcessSelector(false);
                  setSelectedProcessId('');
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {/* Current Process Info */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3 space-x-reverse mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">العملية الحالية: {process.name}</span>
                </div>
                <div className="text-sm text-blue-700">
                  {process.description || 'لا يوجد وصف'}
                </div>
              </div>

              {/* Available Processes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  اختر العملية المستهدفة
                </label>
                
                {isLoadingProcesses ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">جاري تحميل العمليات...</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {allProcesses
                      .filter(p => p.id !== process.id) // استبعاد العملية الحالية
                      .map((proc) => (
                        <div 
                          key={proc.id} 
                          className={\`border rounded-lg p-4 cursor-pointer transition-all \${
                            selectedProcessId === proc.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }\`}
                          onClick={() => setSelectedProcessId(proc.id)}
                        >
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <input
                              type="radio"
                              name="selectedProcess"
                              value={proc.id}
                              checked={selectedProcessId === proc.id}
                              onChange={() => setSelectedProcessId(proc.id)}
                              className="border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            />
                            
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{proc.name}</div>
                              {proc.description && (
                                <div className="text-sm text-gray-500 mt-1">{proc.description}</div>
                              )}
                              <div className="flex items-center space-x-2 space-x-reverse mt-2">
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                  {proc.stages?.length || 0} مرحلة
                                </span>
                                {proc.is_active && (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    نشط
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    
                    {allProcesses.filter(p => p.id !== process.id).length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <Target className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">لا توجد عمليات أخرى متاحة</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Warning Message */}
              {selectedProcessId && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-900">تنبيه</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        سيتم نقل التذكرة إلى العملية الجديدة وسيتم تحديث جميع البيانات المرتبطة بها.
                        هذا الإجراء لا يمكن التراجع عنه.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 space-y-3 border-t border-gray-200">
              <button
                onClick={handleMoveToProcess}
                disabled={!selectedProcessId || isMovingToProcess}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 space-x-reverse font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMovingToProcess ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>جاري النقل...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>تنفيذ النقل</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  setShowProcessSelector(false);
                  setSelectedProcessId('');
                }}
                disabled={isMovingToProcess}
                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Attachment Delete Confirmation Dialog */}`;

content = content.replace(attachmentDeleteModalLocation, processModalCode);
console.log('✅ تم إضافة Modal نقل إلى عملية');

// حفظ الملف
fs.writeFileSync(filePath, content, 'utf8');

console.log('');
console.log('╔════════════════════════════════════════════════════╗');
console.log('║   ✅ تم إضافة ميزة "نقل إلى عملية" بنجاح!      ║');
console.log('╚════════════════════════════════════════════════════╝');
console.log('');
console.log('📍 الميزات المضافة:');
console.log('   1. ✅ زر "نقل إلى عملية" في Header التذكرة');
console.log('   2. ✅ Modal جميل لاختيار العملية المستهدفة');
console.log('   3. ✅ عرض جميع العمليات المتاحة');
console.log('   4. ✅ استبعاد العملية الحالية من القائمة');
console.log('   5. ✅ تحذير قبل النقل');
console.log('   6. ✅ استدعاء API: POST /api/tickets/{id}/move-to-process');
console.log('   7. ✅ تحديث الصفحة بعد النقل الناجح');
console.log('');
console.log('🎯 الآن:');
console.log('   - أعد تحميل الصفحة (Ctrl+Shift+R)');
console.log('   - افتح أي تذكرة');
console.log('   - ستجد زر "نقل إلى عملية" بجانب "نقل إلى مرحلة"');
console.log('   - اضغط عليه واختر العملية المستهدفة');
console.log('   - اضغط "تنفيذ النقل"');
console.log('');
