import React, { useState } from 'react';
import { AppState, Goal, Tactic, TaskStatus } from '../types';
import { generateId } from '../services/storage';
import { enhanceVisionWithAI, suggestGoalsWithAI, generateTacticsWithAI } from '../services/aiHelper';
import { Icons } from './Icons';

interface VisionPlannerProps {
  state: AppState;
  updateState: (newState: AppState) => void;
}

const VisionPlanner: React.FC<VisionPlannerProps> = ({ state, updateState }) => {
  const [localVision, setLocalVision] = useState(state.vision);
  // UI States for AI loading
  const [isEnhancingVision, setIsEnhancingVision] = useState(false);
  const [isGeneratingGoals, setIsGeneratingGoals] = useState(false);
  const [generatingTacticsFor, setGeneratingTacticsFor] = useState<string | null>(null);

  const handleVisionSave = () => {
    updateState({ ...state, vision: localVision });
  };

  const handleAIVisionEnhance = async () => {
    if (!localVision.trim()) {
      alert("請先輸入願景草稿。");
      return;
    }
    setIsEnhancingVision(true);
    try {
      const enhanced = await enhanceVisionWithAI(localVision);
      setLocalVision(enhanced);
    } catch (e) {
      alert("優化願景失敗，請檢查網路連線。");
    } finally {
      setIsEnhancingVision(false);
    }
  };

  const handleAIGoalSuggestion = async () => {
    if (!state.vision.trim() && !localVision.trim()) {
      alert("請先儲存願景聲明。");
      return;
    }
    setIsGeneratingGoals(true);
    try {
      const visionToUse = state.vision || localVision;
      const suggestedGoals = await suggestGoalsWithAI(visionToUse);
      updateState({ ...state, goals: [...state.goals, ...suggestedGoals] });
    } catch (e) {
      alert("產生目標失敗。");
    } finally {
      setIsGeneratingGoals(false);
    }
  };

  const handleAITacticGeneration = async (goalId: string) => {
    const goal = state.goals.find(g => g.id === goalId);
    if (!goal) return;

    setGeneratingTacticsFor(goalId);
    try {
      const newTactics = await generateTacticsWithAI(goal.title, goal.description, goal.tactics.length);
      // Link tactics to this goal
      const linkedTactics = newTactics.map(t => ({ ...t, linkedGoalId: goalId }));
      
      updateGoal(goalId, { tactics: [...goal.tactics, ...linkedTactics] });
    } catch (e) {
      alert("產生策略失敗。");
    } finally {
      setGeneratingTacticsFor(null);
    }
  };

  const addGoal = () => {
    const newGoal: Goal = {
      id: generateId(),
      title: '新 12 週目標',
      description: '',
      progress: 0,
      tactics: []
    };
    updateState({ ...state, goals: [...state.goals, newGoal] });
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    const updatedGoals = state.goals.map(g => g.id === id ? { ...g, ...updates } : g);
    updateState({ ...state, goals: updatedGoals });
  };

  const deleteGoal = (id: string) => {
    if(window.confirm('確定刪除嗎？這將刪除所有相關的策略。')) {
      updateState({ ...state, goals: state.goals.filter(g => g.id !== id) });
    }
  };

  const addTactic = (goalId: string) => {
    const newTactic: Tactic = {
      id: generateId(),
      title: '',
      durationMinutes: 60,
      status: TaskStatus.PENDING,
      linkedGoalId: goalId
    };
    const goal = state.goals.find(g => g.id === goalId);
    if (goal) {
      updateGoal(goalId, { tactics: [...goal.tactics, newTactic] });
    }
  };

  const updateTactic = (goalId: string, tacticId: string, updates: Partial<Tactic>) => {
    const goal = state.goals.find(g => g.id === goalId);
    if (goal) {
      const updatedTactics = goal.tactics.map(t => t.id === tacticId ? { ...t, ...updates } : t);
      updateGoal(goalId, { tactics: updatedTactics });
    }
  };

  const deleteTactic = (goalId: string, tacticId: string) => {
    const goal = state.goals.find(g => g.id === goalId);
    if (goal) {
      updateGoal(goalId, { tactics: goal.tactics.filter(t => t.id !== tacticId) });
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">願景與目標規劃</h1>
      </div>

      {/* Vision Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icons.Start className="text-indigo-600 w-5 h-5" />
            <h2 className="text-lg font-semibold text-gray-800">長期願景 (3-5 年)</h2>
          </div>
          <button
            onClick={handleAIVisionEnhance}
            disabled={isEnhancingVision}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
          >
            {isEnhancingVision ? <Icons.Loader className="w-3 h-3 animate-spin" /> : <Icons.AI className="w-3 h-3" />}
            {isEnhancingVision ? '優化中...' : 'AI 願景優化'}
          </button>
        </div>
        <textarea
          value={localVision}
          onChange={(e) => setLocalVision(e.target.value)}
          placeholder="描述您 3 年後理想的生活與事業狀態... (試著輸入草稿並點擊 'AI 願景優化')"
          className="w-full h-32 p-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        />
        <div className="flex justify-end mt-3">
          <button 
            onClick={handleVisionSave}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Icons.Save className="w-4 h-4" />
            儲存願景
          </button>
        </div>
      </div>

      {/* Goals Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">12 週目標</h2>
          <div className="flex gap-2">
            <button
              onClick={handleAIGoalSuggestion}
              disabled={isGeneratingGoals}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
            >
              {isGeneratingGoals ? <Icons.Loader className="w-4 h-4 animate-spin" /> : <Icons.AI className="w-4 h-4" />}
              {isGeneratingGoals ? '思考中...' : 'AI 建議目標'}
            </button>
            <button 
              onClick={addGoal}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Icons.Plus className="w-4 h-4" />
              新增目標
            </button>
          </div>
        </div>

        {state.goals.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500">尚未設定目標。請手動新增 1-3 個 SMART 目標或使用 AI 建議。</p>
          </div>
        )}

        {state.goals.map((goal) => (
          <div key={goal.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    value={goal.title}
                    onChange={(e) => updateGoal(goal.id, { title: e.target.value })}
                    placeholder="目標標題 (例如：推出新網站)"
                    className="w-full text-xl font-bold text-gray-900 border-none focus:ring-0 p-0 placeholder-gray-300"
                  />
                  <input
                    type="text"
                    value={goal.description}
                    onChange={(e) => updateGoal(goal.id, { description: e.target.value })}
                    placeholder="SMART 描述：具體、可衡量、可達成、相關、有時限"
                    className="w-full text-sm text-gray-600 border-none focus:ring-0 p-0 placeholder-gray-300"
                  />
                </div>
                <button 
                  onClick={() => deleteGoal(goal.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Icons.Delete className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tactics */}
            <div className="bg-gray-50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">每週策略 (Tactics)</h3>
                <div className="flex gap-3">
                   <button
                    onClick={() => handleAITacticGeneration(goal.id)}
                    disabled={generatingTacticsFor === goal.id}
                    className="text-xs font-medium text-purple-600 hover:text-purple-800 flex items-center gap-1 disabled:opacity-50"
                  >
                    {generatingTacticsFor === goal.id ? <Icons.Loader className="w-3 h-3 animate-spin" /> : <Icons.AI className="w-3 h-3" />}
                    AI 自動生成
                  </button>
                  <button 
                     onClick={() => addTactic(goal.id)}
                     className="text-sm text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Icons.Plus className="w-3 h-3" /> 新增策略
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {goal.tactics.map((tactic) => (
                  <div key={tactic.id} className="flex items-center gap-3 bg-white p-3 rounded-md border border-gray-200">
                    <div className="flex-1">
                       <input
                        type="text"
                        value={tactic.title}
                        onChange={(e) => updateTactic(goal.id, tactic.id, { title: e.target.value })}
                        placeholder="可執行的策略 (例如：撰寫 3 篇部落格文章)"
                        className="w-full text-sm border-none focus:ring-0 p-0"
                      />
                    </div>
                    <div className="flex items-center gap-2 border-l pl-3 border-gray-200">
                      <span className="text-xs text-gray-400">時長 (分):</span>
                      <input
                        type="number"
                        value={tactic.durationMinutes}
                        onChange={(e) => updateTactic(goal.id, tactic.id, { durationMinutes: parseInt(e.target.value) || 0 })}
                        className="w-16 text-sm border-gray-200 rounded focus:ring-indigo-500"
                      />
                      <button 
                        onClick={() => deleteTactic(goal.id, tactic.id)}
                        className="text-gray-300 hover:text-red-500 ml-2"
                      >
                         <Icons.Delete className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {goal.tactics.length === 0 && (
                   <p className="text-sm text-gray-400 italic">尚未定義策略。請將此目標分解為每週行動。</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VisionPlanner;