
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Lightbulb, 
  History, 
  Settings, 
  LogOut,
  User
} from 'lucide-react';

interface SidebarProps {}

export function Sidebar({}: SidebarProps) {
  const { profile, signOut } = useAuth();
  const [currentPage, setCurrentPage] = React.useState('usecase-generator');

  const navigation = [
    { name: 'Use Case Generator', href: 'usecase-generator', icon: Lightbulb },
    { name: 'Template Evaluator', href: 'template-evaluator', icon: FileText },
    { name: 'History', href: 'history', icon: History },
    ...(profile?.role === 'admin' ? [{ name: 'Admin Panel', href: 'admin', icon: Settings }] : []),
  ];

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    // Trigger custom event for page change
    window.dispatchEvent(new CustomEvent('pageChange', { detail: page }));
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">
            Prompt Workshop
          </h1>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {profile?.role || 'user'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.href;
            return (
              <button
                key={item.name}
                onClick={() => handlePageChange(item.href)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <Button
            onClick={signOut}
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:text-gray-900"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
