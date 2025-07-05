
import React from 'react';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Loader2, CheckCircle, XCircle, Star } from 'lucide-react';

export function TemplateEvaluator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    generatedUseCases,
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
    setSubmissions,
  } = useAppData();

  const handleEvaluate = async () => {
    const useCase = selectedUseCase === 'custom' ? customUseCase : selectedUseCase;
    
    if (!useCase.trim() || !promptTemplate.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a use case and prompt template.",
        variant: "destructive",
      });
      return;
    }

    setIsEvaluating(true);

    try {
      // Call OpenAI to evaluate the prompt
      const response = await fetch('/api/evaluate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usecase: useCase,
          prompt: promptTemplate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to evaluate prompt');
      }

      const evaluationData = await response.json();
      setEvaluation(evaluationData);

      // Save to database
      if (user) {
        const { data, error } = await supabase
          .from('prompt_submissions')
          .insert({
            user_id: user.id,
            usecase: useCase,
            prompt_template: promptTemplate,
            evaluation: evaluationData,
            score: evaluationData.score || 0,
          })
          .select()
          .single();

        if (error) {
          console.error('Error saving submission:', error);
        } else {
          // Update submissions list
          setSubmissions(prev => [data, ...prev]);
        }
      }

      toast({
        title: "Evaluation Complete!",
        description: `Your prompt scored ${evaluationData.score || 0}/10.`,
      });

    } catch (error) {
      console.error('Error evaluating prompt:', error);
      toast({
        title: "Error",
        description: "Failed to evaluate prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Template Evaluator</h1>
        <p className="text-gray-600">
          Evaluate your prompt templates against specific use cases and get detailed feedback.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Prompt Evaluation
            </CardTitle>
            <CardDescription>
              Select a use case and enter your prompt template for evaluation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usecase">Use Case</Label>
              <Select value={selectedUseCase} onValueChange={setSelectedUseCase}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select a use case or choose custom" />
                </SelectTrigger>
                <SelectContent>
                  {generatedUseCases.map((useCase, index) => (
                    <SelectItem key={index} value={useCase}>
                      {useCase.length > 60 ? `${useCase.substring(0, 60)}...` : useCase}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Use Case</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedUseCase === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="customUseCase">Custom Use Case</Label>
                <Textarea
                  id="customUseCase"
                  placeholder="Describe your custom use case..."
                  value={customUseCase}
                  onChange={(e) => setCustomUseCase(e.target.value)}
                  rows={3}
                  className="rounded-xl resize-none"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt Template</Label>
              <Textarea
                id="prompt"
                placeholder="Enter your prompt template here..."
                value={promptTemplate}
                onChange={(e) => setPromptTemplate(e.target.value)}
                rows={6}
                className="rounded-xl resize-none"
              />
            </div>

            <Button
              onClick={handleEvaluate}
              disabled={isEvaluating || !selectedUseCase || !promptTemplate.trim()}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Evaluating Prompt...
                </>
              ) : (
                'Evaluate Prompt'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Evaluation Results */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Evaluation Results</CardTitle>
            <CardDescription>
              {evaluation 
                ? 'Detailed feedback on your prompt template'
                : 'Your evaluation results will appear here'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {evaluation ? (
              <div className="space-y-6">
                {/* Score */}
                <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Star className="h-6 w-6 text-yellow-500" />
                    <span className="text-3xl font-bold text-blue-700">
                      {evaluation.score}/10
                    </span>
                  </div>
                  <p className="text-gray-600">Overall Score</p>
                </div>

                {/* Match Result */}
                <div className="p-4 rounded-xl border">
                  <div className="flex items-center gap-2 mb-2">
                    {evaluation.matches_usecase ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <h3 className="font-semibold">Use Case Match</h3>
                  </div>
                  <p className="text-gray-700">
                    {evaluation.matches_usecase 
                      ? 'Your prompt aligns well with the selected use case.'
                      : 'Your prompt may not fully address the selected use case.'
                    }
                  </p>
                </div>

                {/* Positive Points */}
                {evaluation.positive_points && (
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <h3 className="font-semibold text-green-800 mb-2">Positive Points</h3>
                    <ul className="space-y-1">
                      {evaluation.positive_points.map((point: string, index: number) => (
                        <li key={index} className="text-green-700 text-sm">
                          • {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Areas for Improvement */}
                {evaluation.lacking && (
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <h3 className="font-semibold text-orange-800 mb-2">Areas for Improvement</h3>
                    <ul className="space-y-1">
                      {evaluation.lacking.map((point: string, index: number) => (
                        <li key={index} className="text-orange-700 text-sm">
                          • {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggestions */}
                {evaluation.suggestions && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h3 className="font-semibold text-blue-800 mb-2">Suggestions</h3>
                    <ul className="space-y-1">
                      {evaluation.suggestions.map((suggestion: string, index: number) => (
                        <li key={index} className="text-blue-700 text-sm">
                          • {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Submit a prompt template to see evaluation results.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
