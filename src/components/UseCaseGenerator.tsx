
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
import { Lightbulb, Loader2 } from 'lucide-react';

export function UseCaseGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    department,
    setDepartment,
    task,
    setTask,
    generatedUseCases,
    setGeneratedUseCases,
    isGenerating,
    setIsGenerating,
  } = useAppData();

  const [customDepartment, setCustomDepartment] = React.useState('');
  const [showCustomInput, setShowCustomInput] = React.useState(false);

  const departmentOptions = [
    'Product Design',
    'Program Management', 
    'Accounting',
    'Content Team',
    'Enter your department'
  ];

  const handleDepartmentChange = (value: string) => {
    if (value === 'Enter your department') {
      setShowCustomInput(true);
      setDepartment('');
    } else {
      setShowCustomInput(false);
      setDepartment(value);
      setCustomDepartment('');
    }
  };

  const handleCustomDepartmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomDepartment(value);
    setDepartment(value);
  };

  const handleGenerate = async () => {
    const finalDepartment = showCustomInput ? customDepartment : department;
    
    if (!finalDepartment.trim() || !task.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both department and task fields.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Call Supabase Edge Function to generate use cases
      const { data, error } = await supabase.functions.invoke('generate-usecases', {
        body: {
          department: finalDepartment,
          task,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate use cases');
      }

      const useCases = data.usecases || [];
      
      setGeneratedUseCases(useCases);

      // Save to database
      if (user) {
        const { error: dbError } = await supabase
          .from('usecases')
          .insert({
            user_id: user.id,
            department: finalDepartment,
            task,
            generated_usecases: useCases,
          });

        if (dbError) {
          console.error('Error saving use cases:', dbError);
        }
      }

      toast({
        title: "Success!",
        description: `Generated ${useCases.length} use cases for your department and task.`,
      });

    } catch (error) {
      console.error('Error generating use cases:', error);
      toast({
        title: "Error",
        description: "Failed to generate use cases. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Use Case Generator</h1>
        <p className="text-gray-600">
          Generate AI-powered use cases based on your department and specific tasks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              Input Details
            </CardTitle>
            <CardDescription>
              Provide information about your department and the task you need use cases for.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select onValueChange={handleDepartmentChange}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select your department" />
                </SelectTrigger>
                <SelectContent>
                  {departmentOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {showCustomInput && (
                <Input
                  placeholder="Enter your department"
                  value={customDepartment}
                  onChange={handleCustomDepartmentChange}
                  className="rounded-xl mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="task">Task Description</Label>
              <Textarea
                id="task"
                placeholder="Describe the specific task or challenge you need use cases for..."
                value={task}
                onChange={(e) => setTask(e.target.value)}
                rows={4}
                className="rounded-xl resize-none"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || (!showCustomInput && !department.trim()) || (showCustomInput && !customDepartment.trim()) || !task.trim()}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Use Cases...
                </>
              ) : (
                'Generate Use Cases'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Use Cases */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Generated Use Cases</CardTitle>
            <CardDescription>
              {generatedUseCases.length > 0 
                ? `${generatedUseCases.length} use cases generated`
                : 'Your use cases will appear here'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedUseCases.length > 0 ? (
              <div className="space-y-4">
                {generatedUseCases.map((useCase, index) => (
                  <div
                    key={index}
                    className="p-4 bg-blue-50 rounded-xl border border-blue-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <p className="text-gray-800 leading-relaxed">{useCase.replace(/\*\*/g, '')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Fill in the form and click "Generate Use Cases" to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
