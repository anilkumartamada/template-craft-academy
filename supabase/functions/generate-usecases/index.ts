
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
            content: `You are an AI assistant helping to generate prompt-template-worthy use cases based on a department and task. 

The use cases you generate will be used by workshop attendees to write prompt templates. Therefore, your use cases must be clearly written as modular, AI-solvable tasks. They should describe a clear input → output behavior that can be easily converted into a prompt template.

Each use case must:
- Be practical and specific to the department and task.
- Describe a well-defined, atomic action (e.g., "Generate an onboarding email for new hires" or "Summarize key features of a product").
- Avoid vagueness, focusing instead on clear, actionable directives that lend themselves to a prompt format.

Use the following context to guide your responses:

1. **Product Design Team** – Responsible for design & prototyping, creating wireframes/mockups, user research, developing design systems, stakeholder presentations, and mentoring.
2. **Program Management** – Focuses on designing admission workflows, campus deployment planning, recruiting and onboarding personnel, training, and coordinating stakeholder updates.
3. **Accounting Team** – Manages ERP data entry, invoice validation, transaction reconciliation, budgeting, customer refunds, and statutory compliance tasks.
4. **Content Team** – Works on writing scripts, marketing copy, social media posts, press releases, UX microcopy, localization, and multimedia content production.

Format your output as a numbered list with each item on its own line starting with "1.", "2.", "3.", and "4.".`
          },
          {
            role: 'user',
            content: `Department: ${department}\nTask: ${task}\n\nGenerate exactly 4 specific use cases that can be directly used to write prompt templates. Each use case should describe a well-defined AI-solvable task that is practical, clear, and actionable. Format your answer as a numbered list.`
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
