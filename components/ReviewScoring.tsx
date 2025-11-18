import React, { useState } from 'react';
import { AppState, TaskStatus } from '../types';
import { Icons } from './Icons';
import { initializeWeek } from '../services/storage';

interface ReviewScoringProps {
  state: AppState;
  updateState: (newState: AppState) => void;
}

const ReviewScoring: React.FC<ReviewScoringProps> = ({ state, updateState }) => {
  const currentWeekData = state.weeks.find(w => w.weekNumber === state.currentWeek);
  const [reflection, setReflection] = useState(currentWeekData?.reflection || '');

  if (!currentWeekData) return <div>無本週資料</div>;

  const totalTasks = currentWeekData.tacticsSnapshot.length;
  const completedTasks = currentWeekData.tacticsSnapshot.filter(t => t.status === TaskStatus.COMPLETED).length;
  const calculatedScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleCompleteWeek = () => {
    const updatedWeeks = state.weeks.map(w => 
      w.weekNumber === state.currentWeek
        ? { ...w, executionScore: calculatedScore, reflection: reflection, isReviewed: true }
        : w
    );

    // Initialize next week
    let nextWeekNum = state.currentWeek + 1;
    let nextWeeksArray = [...updatedWeeks];
    
    if (nextWeekNum <= 12) {
       const nextWeek = initializeWeek(nextWeekNum, state.goals);
       nextWeeksArray.push(nextWeek);
    }

    updateState({
      ...state,
      weeks: nextWeeksArray,
      currentWeek: nextWeekNum > 12 ? 12 : nextWeekNum // Cap at 12 for now
    });
    
    setReflection('');
    alert(`第 ${state.currentWeek} 週完成！您的分數：${calculatedScore}%`);
  };

  return (
    <div className="space-y-8 pb-20">
       <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">每週檢視與評分</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Score Card */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
          <h3 className="text-gray-500 font-medium mb-4">執行分數</h3>
          <div className={`text-6xl font-bold mb-2 ${calculatedScore >= 85 ? 'text-green-500' : 'text-red-500'}`}>
            {calculatedScore}%
          </div>
          <p className="text-sm text-gray-400">
             {totalTasks} 個策略中完成了 {completedTasks} 個
          </p>
          {calculatedScore < 85 && (
            <p className="text-xs text-red-400 mt-4 bg-red-50 p-2 rounded">
              警告：分數低於 85%。請重新檢視您的策略時間方塊。
            </p>
          )}
          {calculatedScore >= 85 && (
            <p className="text-xs text-green-600 mt-4 bg-green-50 p-2 rounded">
              太棒了！您保持在軌道上。
            </p>
          )}
        </div>

        {/* Task Summary List */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 overflow-y-auto max-h-64">
          <h3 className="text-gray-700 font-semibold mb-4">第 {state.currentWeek} 週策略清單</h3>
          <ul className="space-y-2">
            {currentWeekData.tacticsSnapshot.map(t => (
              <li key={t.id} className="flex items-center justify-between text-sm bg-white p-2 rounded border border-gray-200">
                <span className={t.status === TaskStatus.COMPLETED ? 'line-through text-gray-400' : 'text-gray-700'}>
                  {t.title}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  t.status === TaskStatus.COMPLETED ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {t.status === TaskStatus.COMPLETED ? '已完成' : '未完成'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Reflection */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">每週反思</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">什麼做得很好？遇到什麼困難？下週如何改進？</label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="w-full h-32 p-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="反思您的執行狀況..."
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={handleCompleteWeek}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          完成第 {state.currentWeek} 週並開始下一週
          <Icons.ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ReviewScoring;