import React from 'react';
import { AppState } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Icons } from './Icons';
import { Link } from 'react-router-dom';

interface DashboardProps {
  state: AppState;
}

const Dashboard: React.FC<DashboardProps> = ({ state }) => {
  const weeksData = state.weeks.map(w => ({
    name: `W${w.weekNumber}`,
    score: w.executionScore
  }));

  // Fill remaining weeks with empty data for the chart
  for (let i = weeksData.length + 1; i <= 12; i++) {
    weeksData.push({ name: `W${i}`, score: 0 });
  }

  const currentWeekData = state.weeks.find(w => w.weekNumber === state.currentWeek);
  const pendingTasks = currentWeekData ? currentWeekData.tacticsSnapshot.filter(t => t.status === 'PENDING').length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">執行儀表板</h1>
        <div className="text-sm font-medium text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border">
          目前週次: <span className="text-red-600 text-lg">{state.currentWeek}/12</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">執行分數 (平均)</h3>
            <Icons.Review className="text-blue-500 w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {state.weeks.length > 0 
              ? Math.round(state.weeks.reduce((acc, curr) => acc + curr.executionScore, 0) / state.weeks.length) 
              : 0}%
          </div>
          <p className="text-xs text-gray-400 mt-1">目標: 85%+</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">進行中目標</h3>
            <Icons.Goal className="text-purple-500 w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{state.goals.length}</div>
          <p className="text-xs text-gray-400 mt-1">本 12 週週期計畫</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">剩餘任務</h3>
            <Icons.Execution className="text-red-500 w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{pendingTasks}</div>
          <p className="text-xs text-gray-400 mt-1">本週策略行動</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">每週執行分數</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeksData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Line type="monotone" dataKey="score" stroke="#dc2626" strokeWidth={3} dot={{ r: 4, fill: '#dc2626' }} activeDot={{ r: 6 }} />
                {/* Reference line for target */}
                <line x1="0" y1="210" x2="100%" y2="210" stroke="green" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-indigo-900 p-6 rounded-xl shadow-sm border border-indigo-800 text-white flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">願景聲明</h3>
            <p className="text-indigo-200 text-sm leading-relaxed italic">
              {state.vision || "尚未定義願景。請前往規劃區設定您的北極星。"}
            </p>
          </div>
          <Link to="/plan" className="self-end mt-4 bg-white text-indigo-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors">
            編輯願景
          </Link>
        </div>
      </div>

      {state.goals.length === 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 flex items-start gap-4">
          <Icons.Alert className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-lg font-medium text-orange-800">需要設定</h4>
            <p className="text-orange-600 mt-1">您尚未為本 12 週週期設定任何目標。請先定義您的願景和目標以產生執行計畫。</p>
            <Link to="/plan" className="inline-block mt-3 text-orange-700 font-semibold hover:underline">前往規劃 &rarr;</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;