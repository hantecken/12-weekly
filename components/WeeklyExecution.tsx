import React, { useEffect, useState } from 'react';
import { AppState, TaskStatus, Tactic, WeekData } from '../types';
import { initiateGoogleAuth, createCalendarEvent } from '../services/calendarService';
import { initializeWeek } from '../services/storage';
import { Icons } from './Icons';

interface WeeklyExecutionProps {
  state: AppState;
  updateState: (newState: AppState) => void;
}

const WeeklyExecution: React.FC<WeeklyExecutionProps> = ({ state, updateState }) => {
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Ensure we have a current week object
  useEffect(() => {
    const currentWeekData = state.weeks.find(w => w.weekNumber === state.currentWeek);
    if (!currentWeekData && state.goals.length > 0) {
      const newWeek = initializeWeek(state.currentWeek, state.goals);
      updateState({
        ...state,
        weeks: [...state.weeks, newWeek]
      });
    }
  }, [state.currentWeek, state.goals]);

  const currentWeekData = state.weeks.find(w => w.weekNumber === state.currentWeek);

  const handleInitiateConnection = () => {
    setShowAuthModal(true);
  };

  const handleAccountSelect = async (email: string) => {
    setShowAuthModal(false);
    setLoadingCalendar(true);
    
    // Simulate API handshake
    const success = await initiateGoogleAuth();
    
    if (success) {
      updateState({ 
        ...state, 
        isCalendarConnected: true,
        connectedEmail: email 
      });
      showNotification(`已連結 Google 日曆帳戶: ${email}`);
    } else {
      showNotification("連結失敗，請稍後再試", true);
    }
    setLoadingCalendar(false);
  };

  const handleDisconnectCalendar = () => {
    if(window.confirm("確定要取消連結 Google 日曆嗎？")) {
      updateState({
        ...state,
        isCalendarConnected: false,
        connectedEmail: null
      });
      showNotification("已取消連結");
    }
  };

  const pushToCalendar = async (tactic: Tactic) => {
    if (!state.isCalendarConnected) {
      showNotification("請先連結 Google 日曆", true);
      return;
    }

    setLoadingCalendar(true);
    
    // Calculate a mock start time (Next working day at 9AM for demo purposes)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    const endTime = new Date(tomorrow.getTime() + tactic.durationMinutes * 60000);

    await createCalendarEvent({
      summary: `策略時間: ${tactic.title}`,
      description: `12 Week Year 目標執行時段。\n\n任務: ${tactic.title}`,
      startDateTime: tomorrow.toISOString(),
      endDateTime: endTime.toISOString(),
      colorId: '11' // Red for Strategy
    });

    showNotification(`已將 "${tactic.title}" 排程至日曆 (模擬)`);
    setLoadingCalendar(false);
  };

  const toggleTaskStatus = (tacticId: string) => {
    if (!currentWeekData) return;

    const updatedTactics = currentWeekData.tacticsSnapshot.map(t => {
      if (t.id === tacticId) {
        return {
          ...t,
          status: t.status === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED
        };
      }
      return t;
    });

    const updatedWeeks = state.weeks.map(w => 
      w.weekNumber === state.currentWeek 
        ? { ...w, tacticsSnapshot: updatedTactics } 
        : w
    );

    updateState({ ...state, weeks: updatedWeeks });
  };

  const showNotification = (msg: string, isError = false) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  if (!currentWeekData) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-700">第 {state.currentWeek} 週尚無計畫</h2>
        <p className="text-gray-500 mt-2">請先前往「願景與目標」區新增目標與策略。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 relative">
      {notification && (
        <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          {notification}
        </div>
      )}

      {/* Mock Google Account Chooser Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 pb-4 border-b border-gray-100">
              <div className="flex justify-center mb-4">
                <span className="text-2xl font-bold text-gray-700">Google</span>
              </div>
              <h3 className="text-center text-lg font-medium text-gray-800">選擇帳戶</h3>
              <p className="text-center text-sm text-gray-500 mt-1">以繼續使用 12WY PVS 系統</p>
            </div>
            
            <div className="divide-y divide-gray-100">
              {/* Mock Account 1 */}
              <button 
                onClick={() => handleAccountSelect('demo.user@gmail.com')}
                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                  D
                </div>
                <div>
                  <div className="font-medium text-gray-900">Demo User</div>
                  <div className="text-sm text-gray-500">demo.user@gmail.com</div>
                </div>
              </button>

              {/* Mock Account 2 */}
              <button 
                onClick={() => handleAccountSelect('business.planner@company.com')}
                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                  B
                </div>
                <div>
                  <div className="font-medium text-gray-900">Business Planner</div>
                  <div className="text-sm text-gray-500">business.planner@company.com</div>
                </div>
              </button>

              {/* Use another account */}
              <button 
                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                onClick={() => handleAccountSelect('custom.user@example.com')}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500">
                  <Icons.User className="w-6 h-6" />
                </div>
                <div className="font-medium text-gray-700">使用其他帳戶</div>
              </button>
            </div>

            <div className="p-4 border-t border-gray-100 text-xs text-gray-500 text-center">
              <p className="mb-2">如繼續操作，即表示 Google 將與 12WY PVS 分享您的姓名、電子郵件地址和個人資料相片。</p>
              <button 
                onClick={() => setShowAuthModal(false)}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-md transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">第 {state.currentWeek} 週執行</h1>
          <p className="text-gray-500">為您的策略安排時間方塊並執行。</p>
        </div>
        
        {!state.isCalendarConnected ? (
           <button 
             onClick={handleInitiateConnection}
             disabled={loadingCalendar}
             className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
           >
             <Icons.GoogleCalendar className="w-5 h-5 text-blue-500" />
             {loadingCalendar ? '連結中...' : '連結 Google 日曆'}
           </button>
        ) : (
          <div className="flex items-center gap-3">
             <div className="hidden md:block text-right">
                <div className="text-xs text-gray-400">已連結</div>
                <div className="text-sm font-medium text-gray-700">{state.connectedEmail}</div>
             </div>
             <button 
              onClick={handleDisconnectCalendar}
              className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all group"
              title="點擊以中斷連結"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full group-hover:bg-red-500"></div>
              <span className="group-hover:hidden">已連結日曆</span>
              <span className="hidden group-hover:inline">中斷連結</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {currentWeekData.tacticsSnapshot.map((tactic) => (
          <div 
            key={tactic.id} 
            className={`bg-white p-4 rounded-xl shadow-sm border transition-all duration-200 ${
              tactic.status === TaskStatus.COMPLETED ? 'border-green-200 bg-green-50/30' : 'border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => toggleTaskStatus(tactic.id)}
                  className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${
                    tactic.status === TaskStatus.COMPLETED 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'bg-white border-gray-300 text-transparent hover:border-gray-400'
                  }`}
                >
                  <Icons.Execution className="w-4 h-4" />
                </button>
                <div>
                  <h3 className={`font-medium ${tactic.status === TaskStatus.COMPLETED ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {tactic.title}
                  </h3>
                  <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                    {tactic.durationMinutes} 分鐘 • 策略方塊
                  </span>
                </div>
              </div>

              <button 
                onClick={() => pushToCalendar(tactic)}
                disabled={tactic.status === TaskStatus.COMPLETED || loadingCalendar}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tactic.status === TaskStatus.COMPLETED
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                }`}
                title="新增至日曆作為策略時間"
              >
                <Icons.GoogleCalendar className="w-4 h-4" />
                <span className="hidden sm:inline">排程</span>
              </button>
            </div>
          </div>
        ))}

        {currentWeekData.tacticsSnapshot.length === 0 && (
           <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-400">本週尚無安排策略。</p>
           </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
          <Icons.Alert className="w-4 h-4" /> 
          12 Week Year 提示
        </h4>
        <p className="text-sm text-blue-700">
          儘早在一週的開始安排您的<strong>策略方塊 (Strategy Blocks)</strong>。如果您錯過了，請在同一週內重新安排，不要延後到下一週。
        </p>
      </div>
    </div>
  );
};

export default WeeklyExecution;