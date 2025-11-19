import React, { useEffect, useState } from 'react';
import { AppState, TaskStatus, Tactic, WeekData } from '../types';
import { initGoogleServices, signInToGoogle, signOutFromGoogle, createCalendarEvent, configureGoogleCredentials } from '../services/calendarService';
import { initializeWeek } from '../services/storage';
import { Icons } from './Icons';

interface WeeklyExecutionProps {
  state: AppState;
  updateState: (newState: AppState) => void;
}

const WeeklyExecution: React.FC<WeeklyExecutionProps> = ({ state, updateState }) => {
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isServicesReady, setIsServicesReady] = useState(false);
  
  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [clientIdInput, setClientIdInput] = useState(state.googleClientId || '');
  const [apiKeyInput, setApiKeyInput] = useState(state.googleApiKey || '');

  // Initialize Google Services on mount or when keys change
  useEffect(() => {
    const init = async () => {
      // Configure with saved keys from state if available
      if (state.googleClientId && state.googleApiKey) {
        configureGoogleCredentials(state.googleClientId, state.googleApiKey);
      }
      await initGoogleServices();
      setIsServicesReady(true);
    };
    init();
  }, [state.googleClientId, state.googleApiKey]);

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

  const handleConnectClick = () => {
    // 如果沒有設定金鑰，優先開啟設定視窗引導使用者
    if (!state.googleClientId || !state.googleApiKey) {
      setIsSettingsOpen(true);
    } else {
      handleConnectCalendar();
    }
  };

  const handleConnectCalendar = async (forceDemo = false) => {
    if (!isServicesReady && !forceDemo) {
      showNotification("服務初始化中，請稍候...", true);
      return;
    }

    setLoadingCalendar(true);
    try {
      // 如果強制模擬，我們不呼叫真實的 signIn
      const email = await signInToGoogle(); 
      if (email) {
        updateState({ 
          ...state, 
          isCalendarConnected: true,
          connectedEmail: email 
        });
        
        if (email.includes("(模擬帳號)")) {
           showNotification(`[模擬模式] 已連結: ${email}`);
        } else {
           showNotification(`成功連結 Google 帳戶: ${email}`);
        }
      }
    } catch (error) {
      showNotification("連結失敗或使用者取消。", true);
      console.error(error);
    } finally {
      setLoadingCalendar(false);
    }
  };

  const handleDisconnectCalendar = () => {
    if(window.confirm("確定要取消連結 Google 日曆嗎？")) {
      signOutFromGoogle();
      updateState({
        ...state,
        isCalendarConnected: false,
        connectedEmail: null
      });
      showNotification("已取消連結");
    }
  };

  const handleSaveSettings = () => {
    updateState({
      ...state,
      googleClientId: clientIdInput.trim(),
      googleApiKey: apiKeyInput.trim(),
      // Reset connection when keys change to force re-auth
      isCalendarConnected: false,
      connectedEmail: null
    });
    setIsSettingsOpen(false);
    showNotification("API 設定已儲存，請重新連結日曆");
  };

  const handleUseDemoMode = () => {
    setIsSettingsOpen(false);
    // 清空金鑰設定以確保進入模擬模式
    configureGoogleCredentials('', ''); 
    handleConnectCalendar(true);
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

    const success = await createCalendarEvent({
      summary: `策略時間: ${tactic.title}`,
      description: `12 Week Year 目標執行時段。\n\n任務: ${tactic.title}`,
      startDateTime: tomorrow.toISOString(),
      endDateTime: endTime.toISOString(),
      colorId: '11' // Red for Strategy
    });

    if (success) {
      if (state.connectedEmail?.includes("(模擬帳號)")) {
         showNotification(`[模擬] 已將 "${tactic.title}" 排程 (不會真的寫入 Google)`);
      } else {
         showNotification(`已將 "${tactic.title}" 排程至您的 Google 日曆`);
      }
    } else {
      showNotification("寫入日曆失敗，請檢查授權狀態或 API 設定。", true);
    }
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
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in ${notification.includes('失敗') ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'}`}>
          {notification}
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Icons.Settings className="w-5 h-5" />
                Google API 設定
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <Icons.Close className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 space-y-2">
                <p className="font-bold">如何啟用真實 Google 日曆整合？</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>前往 <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="underline">Google Cloud Console</a> 並建立新專案。</li>
                  <li>在「API 和服務」啟用 <b>Google Calendar API</b>。</li>
                  <li>建立「OAuth 用戶端 ID」(應用程式類型選 <b>Web 應用程式</b>)。</li>
                  <li>
                    <span className="text-red-600 font-bold">必要：</span>
                    在「已授權的 JavaScript 來源」加入：<code>{window.location.origin}</code>
                  </li>
                  <li>將 <b>Client ID</b> 與 <b>API Key</b> 填入下方。</li>
                </ol>
                <p className="mt-2 text-xs text-blue-600">若無金鑰，您仍可使用模擬模式體驗流程。</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Client ID</label>
                <input 
                  type="text" 
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  placeholder="例如: 123456789-abcde.apps.googleusercontent.com"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google API Key</label>
                <input 
                  type="text" 
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-between items-center">
              <button 
                onClick={handleUseDemoMode}
                className="text-sm text-gray-500 hover:text-indigo-600 underline"
              >
                略過設定，使用模擬模式
              </button>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  取消
                </button>
                <button 
                  onClick={handleSaveSettings}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  儲存並啟用
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">第 {state.currentWeek} 週執行</h1>
          <p className="text-gray-500">為您的策略安排時間方塊並執行。</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-lg border border-transparent hover:border-gray-200 transition-colors"
            title="設定 Google API 金鑰"
          >
            <Icons.Settings className="w-5 h-5" />
          </button>

          {!state.isCalendarConnected ? (
             <button 
               onClick={handleConnectClick}
               disabled={loadingCalendar}
               className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
             >
               <Icons.GoogleCalendar className="w-5 h-5 text-blue-500" />
               {loadingCalendar ? '連結中...' : '連結 Google 日曆'}
             </button>
          ) : (
            <div className="flex items-center gap-3">
               <div className="hidden md:block text-right">
                  <div className="text-xs text-gray-400">已連結帳戶</div>
                  <div className="text-sm font-medium text-gray-700 flex items-center gap-1 justify-end">
                     <Icons.User className="w-3 h-3" />
                     {state.connectedEmail}
                  </div>
               </div>
               <button 
                onClick={handleDisconnectCalendar}
                className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all group"
                title="點擊以中斷連結"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full group-hover:bg-red-500"></div>
                <span className="group-hover:hidden">已連結</span>
                <span className="hidden group-hover:inline">中斷連結</span>
              </button>
            </div>
          )}
        </div>
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
                title={state.connectedEmail?.includes("(模擬") ? "模擬寫入日曆" : "新增至真實 Google 日曆"}
              >
                <Icons.GoogleCalendar className="w-4 h-4" />
                <span className="hidden sm:inline">寫入日曆</span>
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

      <div className={`border rounded-lg p-4 ${state.connectedEmail?.includes("模擬") ? "bg-blue-50 border-blue-100" : "bg-green-50 border-green-100"}`}>
        <h4 className={`text-sm font-bold mb-2 flex items-center gap-2 ${state.connectedEmail?.includes("模擬") ? "text-blue-800" : "text-green-800"}`}>
          <Icons.Alert className="w-4 h-4" /> 
          {state.connectedEmail?.includes("模擬") ? "目前為模擬/演示模式" : "Google Calendar 功能已啟用"}
        </h4>
        <p className={`text-sm ${state.connectedEmail?.includes("模擬") ? "text-blue-700" : "text-green-700"}`}>
          {state.connectedEmail?.includes("模擬") ? (
             <span>
               目前使用模擬帳號。若要啟用真實 Google 日曆寫入功能，請點擊上方「連結 Google 日曆」或<b>設定圖示</b>輸入 API 金鑰。
             </span>
          ) : (
             <span>
               您已設定有效的 API 金鑰。點擊「寫入日曆」將會真實地在您的 Google 日曆上建立活動（預設時間為明天）。
             </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default WeeklyExecution;