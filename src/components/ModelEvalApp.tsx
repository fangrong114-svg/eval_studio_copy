import React, { useState, useEffect } from 'react';
import { Layers, ChevronRight } from 'lucide-react';
import SetupScreen from './SetupScreen';
import VotingScreen from './VotingScreen';
import ResultsScreen from './ResultsScreen';
import AnalysisScreen from './AnalysisScreen';
import HistoryScreen from './HistoryScreen';
import { DashboardScreen } from './DashboardScreen';
import DatasetRepositoryScreen from './DatasetRepositoryScreen';
import TemplateRepositoryScreen from './TemplateRepositoryScreen';
import TaskBuilderScreen from './TaskBuilderScreen';
import { ConfirmModal } from './ConfirmModal';
import { AppState, EvaluationItem, HistorySession, VoteRecord, VoteType, EvaluationProject } from '../types';
import { auth } from '../firebase';

const STORAGE_KEY = 'modeleval_session';
const HISTORY_KEY = 'modeleval_history';

interface ModelEvalAppProps {
  initialRoute?: AppState | 'dashboard' | 'dataset_repo' | 'template_repo' | 'task_builder';
}

export function ModelEvalApp({ initialRoute = 'dashboard' }: ModelEvalAppProps) {
  const [appState, setAppState] = useState<AppState | 'dashboard' | 'dataset_repo' | 'template_repo' | 'task_builder'>(initialRoute);
  const [items, setItems] = useState<EvaluationItem[]>([]);
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userName, setUserName] = useState('');
  const [modelNames, setModelNames] = useState({ a: 'Model A', b: 'Model B' });
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  
  // History State
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [activeProject, setActiveProject] = useState<EvaluationProject | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [taskBuilderMode, setTaskBuilderMode] = useState<'create' | 'list'>('create');

  // Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Update state if initialRoute changes
  useEffect(() => {
    setAppState(initialRoute);
  }, [initialRoute]);

  // Load History on Mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
  }, []);

  // Check for saved session on load
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setHasSavedSession(true);
    }
  }, [appState]);

  // Auto-save current progress
  useEffect(() => {
    if (appState === 'voting' && items.length > 0) {
      const sessionData = {
        items,
        votes,
        currentIndex,
        userName,
        modelNames,
        timestamp: Date.now(),
        sessionId // Persist the ID
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
    }
  }, [items, votes, currentIndex, appState, userName, modelNames, sessionId]);

  // Save to History when session is complete (moved to results)
  const saveToHistory = (completedVotes: VoteRecord[]) => {
    if (!sessionId || items.length === 0) return;

    const newEntry: HistorySession = {
      id: sessionId,
      timestamp: Date.now(),
      userName: userName || 'Anonymous',
      modelNames,
      items,
      votes: completedVotes
    };

    setHistory(prev => {
      // Avoid duplicates: if session ID exists, update it, otherwise push new
      const exists = prev.find(h => h.id === sessionId);
      const updated = exists 
        ? prev.map(h => h.id === sessionId ? newEntry : h)
        : [...prev, newEntry];
      
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const resumeSession = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setItems(data.items);
        setVotes(data.votes);
        setCurrentIndex(data.currentIndex);
        setUserName(data.userName || '');
        if (data.modelNames) setModelNames(data.modelNames);
        setSessionId(data.sessionId || `session-${Date.now()}`); // Ensure ID exists
        setAppState('voting');
      } catch (e) {
        console.error("Failed to parse saved session");
      }
    }
  };

  const discardSession = () => {
    setConfirmConfig({
      isOpen: true,
      title: '放弃进度',
      message: '您确定要放弃之前的进度吗？此操作无法撤销。',
      onConfirm: () => {
        localStorage.removeItem(STORAGE_KEY);
        setHasSavedSession(false);
      }
    });
  };

  const handleStart = (parsedItems: EvaluationItem[], name: string, parsedNames?: { a: string, b: string }, taskId?: string, existingVotes?: VoteRecord[]) => {
    setItems(parsedItems);
    setUserName(name);
    if (parsedNames) setModelNames(parsedNames);
    else setModelNames({ a: 'Model A', b: 'Model B' });
    if (taskId) setActiveTaskId(taskId);
    
    // Generate unique ID for this session
    setSessionId(`session-${Date.now()}`);

    if (existingVotes && existingVotes.length > 0) {
      setVotes(existingVotes);
      if (existingVotes.length >= parsedItems.length) {
        setCurrentIndex(parsedItems.length - 1);
        setAppState('results');
      } else {
        setCurrentIndex(existingVotes.length);
        setAppState('voting');
      }
    } else {
      setCurrentIndex(0);
      setVotes([]);
      setAppState('voting');
    }
  };

  const handleVote = async (vote: VoteType) => {
    const currentItem = items[currentIndex];
    
    const newVote: VoteRecord = {
      itemId: currentItem.id,
      vote,
      timestamp: Date.now(),
      user: userName
    };

    const updatedVotes = [...votes, newVote];
    setVotes(updatedVotes);

    if (activeTaskId && userName) {
      try {
        const { doc, updateDoc, FieldPath, setDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        const taskRef = doc(db, 'evalTasks', activeTaskId);
        try {
          await updateDoc(taskRef, new FieldPath('progress', userName), currentIndex + 1);
        } catch (updateErr) {
          // If progress map doesn't exist, updateDoc with FieldPath might fail.
          // Fallback to setDoc with merge: true
          await setDoc(taskRef, { progress: { [userName]: currentIndex + 1 } }, { merge: true });
        }
        
        const voteRef = doc(db, 'evalTasks', activeTaskId, 'userVotes', userName);
        await setDoc(voteRef, { votes: updatedVotes }, { merge: true });
      } catch (e) {
        console.error("Failed to update task progress", e);
      }
    }

    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Session Complete
      saveToHistory(updatedVotes);
      setAppState('results');
    }
  };

  const handleGoBack = async () => {
    if (currentIndex > 0) {
      const updatedVotes = votes.slice(0, -1);
      setVotes(updatedVotes);
      setCurrentIndex(prev => prev - 1);

      if (activeTaskId && userName) {
        try {
          const { doc, updateDoc, FieldPath, setDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          const taskRef = doc(db, 'evalTasks', activeTaskId);
          try {
            await updateDoc(taskRef, new FieldPath('progress', userName), currentIndex - 1);
          } catch (updateErr) {
            await setDoc(taskRef, { progress: { [userName]: currentIndex - 1 } }, { merge: true });
          }
          
          const voteRef = doc(db, 'evalTasks', activeTaskId, 'userVotes', userName);
          await setDoc(voteRef, { votes: updatedVotes }, { merge: true });
        } catch (e) {
          console.error("Failed to update task progress on go back", e);
        }
      }
    }
  };

  const handleReset = () => {
    setConfirmConfig({
      isOpen: true,
      title: '清除数据',
      message: '您确定吗？这将清除您当前的会话数据。',
      onConfirm: () => {
        setAppState('setup');
        setItems([]);
        setVotes([]);
        setCurrentIndex(0);
        setModelNames({ a: 'Model A', b: 'Model B' });
        setSessionId('');
        localStorage.removeItem(STORAGE_KEY);
        setHasSavedSession(false);
      }
    });
  };

  const handleEndSessionEarly = () => {
    if (votes.length > 0) {
      saveToHistory(votes);
      setAppState('results');
    } else {
      handleReset();
    }
  };

  // History Management
  const clearHistory = () => {
    setConfirmConfig({
      isOpen: true,
      title: '删除所有历史记录',
      message: '删除所有历史记录？此操作无法撤销。',
      onConfirm: () => {
        localStorage.removeItem(HISTORY_KEY);
        setHistory([]);
      }
    });
  };

  const deleteSession = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: '删除会话',
      message: '删除此会话？',
      onConfirm: () => {
        const updated = history.filter(h => h.id !== id);
        setHistory(updated);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      }
    });
  };

  return (
    <div className="h-[calc(100vh-64px)] overflow-auto bg-bg-base text-text-primary font-sans selection:bg-amber-500/30">
      {/* Main Container */}
      <div className="h-full">
        {appState === 'dashboard' && (
          <div className="h-full py-10">
            <DashboardScreen 
              initialProject={activeProject}
              onProjectSelect={setActiveProject}
              onGoToExecution={(project, taskItems, taskName, modelNames, taskId, existingVotes) => {
                setActiveProject(project);
                if (taskItems && taskItems.length > 0) {
                  const userName = auth.currentUser?.email || auth.currentUser?.displayName || localStorage.getItem('eval_username') || 'Anonymous';
                  handleStart(taskItems, userName, modelNames, taskId, existingVotes);
                } else {
                  setAppState('setup');
                }
              }}
              onGoToAnalysis={(project) => {
                setActiveProject(project);
                setAppState('analysis');
              }}
              onGoToDatasetRepo={() => setAppState('dataset_repo')}
              onGoToTemplateRepo={() => setAppState('template_repo')}
              onGoToTaskBuilder={(project, mode) => {
                setActiveProject(project);
                setTaskBuilderMode(mode || 'create');
                setAppState('task_builder');
              }}
            />
          </div>
        )}

        {appState === 'dataset_repo' && (
          <div className="h-full py-10">
            <DatasetRepositoryScreen 
              onBack={() => setAppState('dashboard')}
            />
          </div>
        )}

        {appState === 'template_repo' && (
          <div className="h-full py-10">
            <TemplateRepositoryScreen 
              onBack={() => setAppState('dashboard')}
            />
          </div>
        )}

        {appState === 'task_builder' && (
          <div className="h-full py-10">
            <TaskBuilderScreen 
              projectId={activeProject?.id}
              initialMode={taskBuilderMode}
              onBack={() => setAppState('dashboard')}
            />
          </div>
        )}

        {appState === 'setup' && (
          <div className="min-h-full flex flex-col py-10">
            <div className="my-auto">
              <SetupScreen 
                project={activeProject}
                onStart={handleStart} 
                onGoToAnalysis={() => setAppState('analysis')}
                onGoToHistory={() => setAppState('history')}
                onBack={() => setAppState('dashboard')}
                savedSession={hasSavedSession}
                onResume={resumeSession}
                onDiscardSession={discardSession}
              />
            </div>
          </div>
        )}

        {appState === 'analysis' && (
          <div className="h-full py-10">
            <AnalysisScreen 
              onBack={() => setAppState('setup')} 
              onGoToDashboard={() => setAppState('dashboard')}
            />
          </div>
        )}

        {appState === 'history' && (
          <div className="h-full py-10">
            <HistoryScreen 
              history={history}
              onBack={() => setAppState('setup')}
              onGoToDashboard={() => setAppState('dashboard')}
              onClearHistory={clearHistory}
              onDeleteSession={deleteSession}
            />
          </div>
        )}

        {appState === 'voting' && items.length > 0 && (
          <VotingScreen 
            item={items[currentIndex]}
            nextItem={items[currentIndex + 1]}
            currentIndex={currentIndex}
            totalItems={items.length}
            onVote={handleVote}
            onEnd={handleEndSessionEarly}
            onBack={() => setAppState('dashboard')}
            onGoBack={currentIndex > 0 ? handleGoBack : undefined}
          />
        )}

        {appState === 'results' && (
          <div className="h-full py-10">
            <ResultsScreen 
              votes={votes} 
              items={items}
              onReset={handleReset} 
              userName={userName}
              modelNames={modelNames}
              onGoToDashboard={() => setAppState('dashboard')}
            />
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
