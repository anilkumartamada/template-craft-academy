
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
    const { department, task } = await req.json()

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant helping to generate specific use cases for prompt templates. Generate exactly 4 practical, actionable use cases based on the department and task provided. Each use case should be detailed and specific to help users understand how they might apply AI prompts in that context.`
          },
          {
            role: 'user',
            content: `Department: ${department}\nTask: ${task}\n\nGenerate exactly 4 specific use cases for prompt templates that would be useful for this department and task. Make each use case practical and actionable.`
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    })

    const openAIData = await openAIResponse.json()
    
    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIData.error?.message || 'Unknown error'}`)
    }

    const content = openAIData.choices[0]?.message?.content || ''
    
    // Parse the response to extract individual use cases
    const useCases = content
      .split(/\d+\.|\n-|\n\*/)
      .map((useCase: string) => useCase.trim())
      .filter((useCase: string) => useCase.length > 20)
      .slice(0, 4) // Ensure exactly 4 use cases

    return new Response(
      JSON.stringify({ usecases: useCases }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error generating use cases:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
