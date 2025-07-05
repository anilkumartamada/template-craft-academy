
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface UseCase {
  id: string;
  department: string;
  task: string;
  generated_usecases: string[];
  created_at: string;
}

interface PromptSubmission {
  id: string;
  usecase: string;
  prompt_template: string;
  evaluation: any;
  score: number;
  created_at: string;
}

interface AppDataContextType {
  // Use Case Generator
  department: string;
  setDepartment: (value: string) => void;
  task: string;
  setTask: (value: string) => void;
  generatedUseCases: string[];
  setGeneratedUseCases: (cases: string[]) => void;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
  
  // Template Evaluator
  selectedUseCase: string;
  setSelectedUseCase: (value: string) => void;
  customUseCase: string;
  setCustomUseCase: (value: string) => void;
  promptTemplate: string;
  setPromptTemplate: (value: string) => void;
  evaluation: any;
  setEvaluation: (value: any) => void;
  isEvaluating: boolean;
  setIsEvaluating: (value: boolean) => void;
  
  // History
  submissions: PromptSubmission[];
  setSubmissions: (submissions: PromptSubmission[]) => void;
  
  // Clear functions
  clearUseCaseData: () => void;
  clearEvaluationData: () => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // Use Case Generator state
  const [department, setDepartment] = useState('');
  const [task, setTask] = useState('');
  const [generatedUseCases, setGeneratedUseCases] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Template Evaluator state
  const [selectedUseCase, setSelectedUseCase] = useState('');
  const [customUseCase, setCustomUseCase] = useState('');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  // History state
  const [submissions, setSubmissions] = useState<PromptSubmission[]>([]);

  // Clear functions
  const clearUseCaseData = () => {
    setDepartment('');
    setTask('');
    setGeneratedUseCases([]);
  };

  const clearEvaluationData = () => {
    setSelectedUseCase('');
    setCustomUseCase('');
    setPromptTemplate('');
    setEvaluation(null);
  };

  // Reset state when user changes
  useEffect(() => {
    if (!user) {
      clearUseCaseData();
      clearEvaluationData();
      setSubmissions([]);
    }
  }, [user]);

  const value = {
    department,
    setDepartment,
    task,
    setTask,
    generatedUseCases,
    setGeneratedUseCases,
    isGenerating,
    setIsGenerating,
    selectedUseCase,
    setSelectedUseCase,
    customUseCase,
    setCustomUseCase,
    promptTemplate,
    setPromptTemplate,
    evaluation,
    setEvaluation,
    isEvaluating,
    setIsEvaluating,
    submissions,
    setSubmissions,
    clearUseCaseData,
    clearEvaluationData,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
}
