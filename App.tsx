import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import VisionPlanner from './components/VisionPlanner';
import WeeklyExecution from './components/WeeklyExecution';
import ReviewScoring from './components/ReviewScoring';
import { AppState } from './types';
import { loadState, saveState } from './services/storage';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(loadState());

  // Persist state changes
  useEffect(() => {
    saveState(appState);
  }, [appState]);

  const updateState = (newState: AppState) => {
    setAppState(newState);
  };

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard state={appState} />} />
          <Route path="/plan" element={<VisionPlanner state={appState} updateState={updateState} />} />
          <Route path="/execute" element={<WeeklyExecution state={appState} updateState={updateState} />} />
          <Route path="/review" element={<ReviewScoring state={appState} updateState={updateState} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;