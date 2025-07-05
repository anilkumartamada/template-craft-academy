
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings, Users, Star, Calendar, Crown } from 'lucide-react';
import { format } from 'date-fns';

interface AdminSubmission {
  id: string;
  usecase: string;
  prompt_template: string;
  score: number;
  created_at: string;
  profiles: {
    name: string;
    email: string;
  };
}

export function AdminPanel() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [uniqueUsers, setUniqueUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchAdminData();
    }
  }, [profile]);

  const fetchAdminData = async () => {
    try {
      // Get submissions from the past 10 hours
      const tenHoursAgo = new Date();
      tenHoursAgo.setHours(tenHoursAgo.getHours() - 10);

      const { data: submissionsData, error: submissionsError } = await supabase
        .from('prompt_submissions')
        .select(`
          id,
          usecase,
          prompt_template,
          score,
          created_at,
          profiles (
            name,
            email
          )
        `)
        .gte('created_at', tenHoursAgo.toISOString())
        .order('score', { ascending: false })
        .order('created_at', { ascending: true });

      if (submissionsError) {
        console.error('Error fetching submissions:', submissionsError);
      } else {
        setSubmissions(submissionsData || []);
        
        // Count unique users
        const uniqueUserIds = new Set(submissionsData?.map(s => s.profiles?.email) || []);
        setUniqueUsers(uniqueUserIds.size);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminRole = async () => {
    const newRole = profile?.role === 'admin' ? 'user' : 'admin';
    
    try {
      await updateProfile({ role: newRole });
      toast({
        title: "Role Updated",
        description: `Role changed to ${newRole}`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">
            Administrative tools and analytics for workshop management.
          </p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="text-center py-12">
            <Crown className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Access Required</h3>
            <p className="text-gray-500 mb-4">
              You need admin privileges to access this panel.
            </p>
            <Button onClick={toggleAdminRole} className="rounded-xl">
              Grant Admin Access
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">
            Overview of all prompt submissions from the past 10 hours.
          </p>
        </div>
        <Button onClick={toggleAdminRole} variant="outline" className="rounded-xl">
          Switch to User Role
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
            <p className="text-xs text-muted-foreground">
              Past 10 hours
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">
              Active participants
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
          <CardDescription>
            All prompt template submissions sorted by score (highest first)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading submissions...</p>
            </div>
          ) : submissions.length > 0 ? (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="p-4 border rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-medium text-gray-900">
                          {submission.profiles?.name || 'Unknown User'}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {submission.profiles?.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(submission.created_at), 'PPP p')}
                      </div>
                    </div>
                    <Badge className={`${getScoreColor(submission.score)} border`}>
                      <Star className="h-3 w-3 mr-1" />
                      {submission.score}/10
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Use Case:</span>
                      <p className="text-sm text-gray-600 mt-1">
                        {submission.usecase.length > 100 
                          ? `${submission.usecase.substring(0, 100)}...`
                          : submission.usecase
                        }
                      </p>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-700">Prompt Template:</span>
                      <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded border">
                        {submission.prompt_template.length > 150 
                          ? `${submission.prompt_template.substring(0, 150)}...`
                          : submission.prompt_template
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Submissions</h3>
              <p className="text-gray-500">
                No prompt submissions have been made in the past 10 hours.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
