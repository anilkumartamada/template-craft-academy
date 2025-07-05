
import React, { useEffect } from 'react';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { History as HistoryIcon, Star, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export function History() {
  const { user } = useAuth();
  const { submissions, setSubmissions } = useAppData();

  useEffect(() => {
    if (user) {
      fetchSubmissions();
    }
  }, [user]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('prompt_submissions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching submissions:', error);
      } else {
        setSubmissions(data || []);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Submission History</h1>
        <p className="text-gray-600">
          Review all your previous prompt template submissions and their evaluations.
        </p>
      </div>

      {submissions.length > 0 ? (
        <div className="space-y-6">
          {submissions.map((submission) => (
            <Card key={submission.id} className="shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {submission.usecase.length > 80 
                        ? `${submission.usecase.substring(0, 80)}...`
                        : submission.usecase
                      }
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(submission.created_at), 'PPP p')}
                    </CardDescription>
                  </div>
                  <Badge className={`${getScoreColor(submission.score)} border`}>
                    <Star className="h-3 w-3 mr-1" />
                    {submission.score}/10
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Prompt Template */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Prompt Template</h4>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {submission.prompt_template}
                    </p>
                  </div>
                </div>

                {/* Evaluation Summary */}
                {submission.evaluation && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Positive Points */}
                    {submission.evaluation.positive_points && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <h5 className="font-medium text-green-800 mb-2">Positive Points</h5>
                        <ul className="space-y-1">
                          {submission.evaluation.positive_points.slice(0, 3).map((point: string, index: number) => (
                            <li key={index} className="text-green-700 text-sm">
                              • {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Suggestions */}
                    {submission.evaluation.suggestions && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <h5 className="font-medium text-blue-800 mb-2">Key Suggestions</h5>
                        <ul className="space-y-1">
                          {submission.evaluation.suggestions.slice(0, 3).map((suggestion: string, index: number) => (
                            <li key={index} className="text-blue-700 text-sm">
                              • {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-lg">
          <CardContent className="text-center py-12">
            <HistoryIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions Yet</h3>
            <p className="text-gray-500">
              Your prompt template submissions will appear here after you evaluate them.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
