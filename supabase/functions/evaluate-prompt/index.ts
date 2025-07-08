
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { usecase, prompt } = await req.json()

    // Check for placeholders in the prompt
    const hasPlaceholders = /[\[\]<>{}]|{{.*?}}|\{.*?\}/.test(prompt) || 
                           prompt.includes('[') || 
                           prompt.includes(']') || 
                           prompt.includes('<') || 
                           prompt.includes('>') || 
                           prompt.includes('{') || 
                           prompt.includes('}')

    // If no placeholders are found, return specific feedback
    if (!hasPlaceholders) {
      const placeholderEvaluation = {
        matches_usecase: false,
        positive_points: [],
        lacking: ["Placeholders are necessary"],
        suggestions: [],
        score: 2
      }

      return new Response(
        JSON.stringify(placeholderEvaluation),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `You are an expert prompt engineering evaluator. Analyze the given prompt template against the specified use case and provide structured feedback. 

IMPORTANT: Be lenient with use case matching. Even if the prompt template and use case are only slightly similar or related, consider it as a match (matches_usecase: true). Only mark as no match if they are completely unrelated or contradictory.

Return your response as a JSON object with the following structure:
{
  "matches_usecase": boolean,
  "positive_points": ["point1", "point2", ...],
  "lacking": ["issue1", "issue2", ...],
  "suggestions": ["suggestion1", "suggestion2", ...],
  "score": number (0-10)
}

Evaluate based on:
1. Relevance to the use case (be generous with matching)
2. Clarity and specificity
3. Completeness of instructions
4. Potential effectiveness
5. Professional structure

Provide full evaluation results with positive points, areas for improvement, AND suggestions even when the match is not perfect, as long as there's some relation between the use case and prompt.`
          },
          {
            role: 'user',
            content: `Use Case: ${usecase}\n\nPrompt Template: ${prompt}\n\nPlease evaluate this prompt template against the use case and provide detailed feedback in the specified JSON format. Be lenient with matching - if there's any reasonable connection, consider it a match.`
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    })

    const openAIData = await openAIResponse.json()
    
    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIData.error?.message || 'Unknown error'}`)
    }

    const content = openAIData.choices[0]?.message?.content || ''
    
    try {
      // Try to parse the JSON response
      const evaluation = JSON.parse(content)
      
      // Ensure all required fields are present and apply lenient matching
      const structuredEvaluation = {
        matches_usecase: evaluation.matches_usecase !== false, // Default to true unless explicitly false
        positive_points: Array.isArray(evaluation.positive_points) ? evaluation.positive_points : [],
        lacking: Array.isArray(evaluation.lacking) ? evaluation.lacking : [],
        suggestions: Array.isArray(evaluation.suggestions) ? evaluation.suggestions : [],
        score: Math.max(0, Math.min(10, evaluation.score || 0))
      }

      return new Response(
        JSON.stringify(structuredEvaluation),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } catch (parseError) {
      // If parsing fails, create a fallback response with lenient matching
      console.error('Failed to parse OpenAI response:', parseError)
      
      const fallbackEvaluation = {
        matches_usecase: true, // Default to true for lenient matching
        positive_points: ["Received response from AI", "Contains prompt structure"],
        lacking: ["Unable to parse detailed evaluation"],
        suggestions: ["Please try again with a clearer prompt template"],
        score: 5
      }

      return new Response(
        JSON.stringify(fallbackEvaluation),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }
  } catch (error) {
    console.error('Error evaluating prompt:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
      },
    )
  }
})
