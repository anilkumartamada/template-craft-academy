
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
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant helping to generate specific use cases based on department and task. Generate exactly 4 practical, actionable use cases based on the department and task provided. Format your response as a numbered list with each use case on a separate line, starting with "1.", "2.", "3.", and "4.". Each use case should be detailed and specific.`
          },
          {
            role: 'user',
            content: `Department: ${department}\nTask: ${task}\n\nGenerate exactly 4 specific use cases that would be useful for this department and task. Make each use case practical and actionable. Format as a numbered list.`
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
      .split(/(?:^|\n)\s*\d+\.\s*/)
      .map((useCase: string) => useCase.trim())
      .filter((useCase: string) => useCase.length > 10)
      .slice(0, 4) // Ensure exactly 4 use cases

    // If we don't get 4 use cases, try alternative parsing
    if (useCases.length < 4) {
      const alternativeUseCases = content
        .split(/\n/)
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((line: string) => line.length > 10)
        .slice(0, 4)
      
      if (alternativeUseCases.length >= useCases.length) {
        return new Response(
          JSON.stringify({ usecases: alternativeUseCases }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }
    }

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
