
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UseCaseGenerator } from './UseCaseGenerator';
import { TemplateEvaluator } from './TemplateEvaluator';
import { History } from './History';
import { AdminPanel } from './AdminPanel';

export function Dashboard() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('usecase-generator');

  useEffect(() => {
    const handlePageChange = (event: CustomEvent) => {
      setCurrentPage(event.detail);
    };

    window.addEventListener('pageChange', handlePageChange as EventListener);
    return () => {
      window.removeEventListener('pageChange', handlePageChange as EventListener);
    };
  }, []);

  if (!user) {
    return null;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'usecase-generator':
        return <UseCaseGenerator />;
      case 'template-evaluator':
        return <TemplateEvaluator />;
      case 'history':
        return <History />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <UseCaseGenerator />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderCurrentPage()}
    </div>
  );
}
