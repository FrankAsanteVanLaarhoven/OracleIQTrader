import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Book, Target, Play, CheckCircle, Lock,
  Trophy, Star, Zap, ChevronRight, Clock, Award, BarChart3
} from 'lucide-react';
import NeonButton from './NeonButton';
import GlassCard from './GlassCard';

const API = process.env.REACT_APP_BACKEND_URL;

const TrainingCenter = () => {
  const [content, setContent] = useState({ tutorials: [], lessons: [], scenarios: [] });
  const [progress, setProgress] = useState(null);
  const [activeTab, setActiveTab] = useState('tutorials');
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch training content
  const fetchContent = useCallback(async () => {
    try {
      const response = await fetch(`${API}/training/content`);
      if (response.ok) {
        const data = await response.json();
        setContent(data);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  }, []);

  // Fetch user progress
  const fetchProgress = useCallback(async () => {
    try {
      const response = await fetch(`${API}/training/progress`);
      if (response.ok) {
        const data = await response.json();
        setProgress(data);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Complete tutorial
  const completeTutorial = async (tutorialId) => {
    try {
      const response = await fetch(`${API}/training/tutorial/${tutorialId}/complete`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        await fetchProgress();
        return data;
      }
    } catch (error) {
      console.error('Error completing tutorial:', error);
    }
  };

  // Complete lesson
  const completeLesson = async (lessonId, quizScore = 100) => {
    try {
      const response = await fetch(`${API}/training/lesson/${lessonId}/complete?quiz_score=${quizScore}`, {
        method: 'POST'
      });
      if (response.ok) {
        await fetchProgress();
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  };

  useEffect(() => {
    fetchContent();
    fetchProgress();
  }, [fetchContent, fetchProgress]);

  const isCompleted = (type, id) => {
    if (!progress) return false;
    if (type === 'tutorial') return progress.completed_tutorials?.includes(id);
    if (type === 'lesson') return progress.completed_lessons?.includes(id);
    if (type === 'scenario') return progress.completed_scenarios?.some(s => s.scenario_id === id);
    return false;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-500/20';
      case 'intermediate': return 'text-amber-400 bg-amber-500/20';
      case 'advanced': return 'text-red-400 bg-red-500/20';
      case 'expert': return 'text-purple-400 bg-purple-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'basics': return GraduationCap;
      case 'technical_analysis': return BarChart3;
      case 'risk_management': return Target;
      case 'psychology': return Zap;
      default: return Book;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="training-center">
      {/* Header with Progress */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="text-teal-400" />
            Training Center
          </h2>
          <p className="text-slate-400 text-sm">Learn to trade like a pro</p>
        </div>
        
        {/* Level Progress */}
        {progress && (
          <div className="flex items-center gap-4 p-4 rounded-xl bg-black/40 border border-white/10">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white font-bold">{progress.current_level}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Level</p>
            </div>
            <div className="flex-1 min-w-[120px]">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">XP</span>
                <span className="text-teal-400">{progress.total_xp}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400"
                  style={{ width: `${Math.min(100, (progress.total_xp % 500) / 5)}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <Trophy className="text-amber-400 mx-auto" size={24} />
              <p className="text-xs text-slate-500 mt-1">{progress.badges?.length || 0} Badges</p>
            </div>
          </div>
        )}
      </div>

      {/* Skills Overview */}
      {progress?.skills && (
        <GlassCard title="Your Skills" icon="💪" accent="cyan">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(progress.skills).map(([skill, level]) => (
              <div key={skill} className="text-center">
                <div className="relative w-16 h-16 mx-auto">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="32" cy="32" r="28"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="32" cy="32" r="28"
                      fill="none"
                      stroke="url(#skillGradient)"
                      strokeWidth="4"
                      strokeDasharray={`${level * 1.76} 176`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="skillGradient">
                        <stop offset="0%" stopColor="#14b8a6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-white font-mono text-sm">
                    {level}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2 capitalize">
                  {skill.replace('_', ' ')}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {[
          { id: 'tutorials', label: 'Tutorials', icon: Play },
          { id: 'lessons', label: 'Lessons', icon: Book },
          { id: 'scenarios', label: 'Scenarios', icon: Target }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-teal-500/20 text-teal-400'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="wait">
          {activeTab === 'tutorials' && content.tutorials.map((tutorial, index) => {
            const completed = isCompleted('tutorial', tutorial.id);
            const CategoryIcon = getCategoryIcon(tutorial.category);
            
            return (
              <motion.div
                key={tutorial.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <div 
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    completed 
                      ? 'bg-green-500/5 border-green-500/30' 
                      : 'bg-white/5 border-white/10 hover:border-teal-500/50'
                  }`}
                  onClick={() => setSelectedItem({ type: 'tutorial', data: tutorial })}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${completed ? 'bg-green-500/20' : 'bg-teal-500/20'}`}>
                        {completed ? <CheckCircle className="text-green-400" size={20} /> : <CategoryIcon className="text-teal-400" size={20} />}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs ${getDifficultyColor(tutorial.difficulty)}`}>
                        {tutorial.difficulty}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star size={14} />
                      <span className="text-xs">{tutorial.rewards?.xp || 100} XP</span>
                    </div>
                  </div>
                  
                  <h3 className="text-white font-semibold mb-1">{tutorial.title}</h3>
                  <p className="text-slate-400 text-sm mb-3">{tutorial.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock size={12} />
                      {tutorial.estimated_time_minutes} min
                    </div>
                    <ChevronRight className="text-slate-500" size={16} />
                  </div>
                </div>
              </motion.div>
            );
          })}

          {activeTab === 'lessons' && content.lessons.map((lesson, index) => {
            const completed = isCompleted('lesson', lesson.id);
            const CategoryIcon = getCategoryIcon(lesson.category);
            
            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div 
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    completed 
                      ? 'bg-green-500/5 border-green-500/30' 
                      : 'bg-white/5 border-white/10 hover:border-teal-500/50'
                  }`}
                  onClick={() => setSelectedItem({ type: 'lesson', data: lesson })}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${completed ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
                        {completed ? <CheckCircle className="text-green-400" size={20} /> : <CategoryIcon className="text-blue-400" size={20} />}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs ${getDifficultyColor(lesson.difficulty)}`}>
                        {lesson.difficulty}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-white font-semibold mb-1">{lesson.title}</h3>
                  <p className="text-slate-400 text-sm mb-3">{lesson.description}</p>
                  
                  {lesson.key_concepts?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {lesson.key_concepts.slice(0, 3).map(concept => (
                        <span key={concept} className="px-2 py-0.5 rounded text-xs bg-white/10 text-slate-300">
                          {concept}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock size={12} />
                      {lesson.estimated_time_minutes} min
                    </div>
                    <ChevronRight className="text-slate-500" size={16} />
                  </div>
                </div>
              </motion.div>
            );
          })}

          {activeTab === 'scenarios' && content.scenarios.map((scenario, index) => {
            const completed = isCompleted('scenario', scenario.id);
            const scenarioRecord = progress?.completed_scenarios?.find(s => s.scenario_id === scenario.id);
            
            return (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div 
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    completed 
                      ? 'bg-green-500/5 border-green-500/30' 
                      : 'bg-white/5 border-white/10 hover:border-teal-500/50'
                  }`}
                  onClick={() => setSelectedItem({ type: 'scenario', data: scenario })}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${completed ? 'bg-green-500/20' : 'bg-purple-500/20'}`}>
                        {completed ? <CheckCircle className="text-green-400" size={20} /> : <Target className="text-purple-400" size={20} />}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs ${getDifficultyColor(scenario.difficulty)}`}>
                        {scenario.difficulty}
                      </span>
                    </div>
                    {scenarioRecord && (
                      <div className="flex items-center gap-1 text-amber-400">
                        <Award size={14} />
                        <span className="text-xs">{scenarioRecord.score}/100</span>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-white font-semibold mb-1">{scenario.title}</h3>
                  <p className="text-slate-400 text-sm mb-3">{scenario.description}</p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Target: <span className="text-green-400">+{scenario.target_profit_percent}%</span>
                    </span>
                    <span className="text-slate-500">
                      Max DD: <span className="text-red-400">{scenario.max_drawdown_percent}%</span>
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-slate-900 border border-white/10 p-6"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-2">{selectedItem.data.title}</h3>
              <p className="text-slate-400 mb-4">{selectedItem.data.description}</p>
              
              {selectedItem.type === 'lesson' && selectedItem.data.content && (
                <div className="prose prose-invert prose-sm max-w-none mb-4">
                  <pre className="whitespace-pre-wrap text-slate-300 text-sm bg-black/40 p-4 rounded-lg">
                    {selectedItem.data.content}
                  </pre>
                </div>
              )}
              
              {selectedItem.type === 'tutorial' && selectedItem.data.steps && (
                <div className="space-y-3 mb-4">
                  {selectedItem.data.steps.map((step, i) => (
                    <div key={step.id} className="p-3 rounded-lg bg-black/40 border border-white/10">
                      <p className="text-teal-400 text-sm font-semibold">Step {step.order}: {step.title}</p>
                      <p className="text-slate-300 text-sm mt-1">{step.content}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedItem.type === 'scenario' && (
                <div className="space-y-3 mb-4">
                  <div className="p-3 rounded-lg bg-black/40">
                    <p className="text-sm text-slate-400">Starting Balance: <span className="text-white">${selectedItem.data.initial_balance}</span></p>
                    <p className="text-sm text-slate-400">Time Limit: <span className="text-white">{selectedItem.data.time_limit_minutes} minutes</span></p>
                  </div>
                  {selectedItem.data.hints?.length > 0 && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <p className="text-amber-400 text-sm font-semibold mb-2">💡 Hints</p>
                      {selectedItem.data.hints.map((hint, i) => (
                        <p key={i} className="text-slate-300 text-sm">• {hint}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                <NeonButton onClick={() => setSelectedItem(null)} variant="white" size="sm">
                  Close
                </NeonButton>
                {!isCompleted(selectedItem.type, selectedItem.data.id) && (
                  <NeonButton 
                    onClick={async () => {
                      if (selectedItem.type === 'tutorial') {
                        await completeTutorial(selectedItem.data.id);
                      } else if (selectedItem.type === 'lesson') {
                        await completeLesson(selectedItem.data.id);
                      }
                      setSelectedItem(null);
                    }} 
                    variant="cyan" 
                    size="sm"
                  >
                    <CheckCircle size={16} />
                    Mark Complete
                  </NeonButton>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrainingCenter;
