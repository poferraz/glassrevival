export interface AISuggestion {
  exercise: string;
  sets: number;
  reps: number;
  weight?: number;
  notes?: string;
}

export const isAIConfigured = (): boolean => {
  // Check if API key is configured
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  return !!apiKey && apiKey.trim() !== '';
};

export const generateAISuggestion = async (
  exercise: string,
  previousSets: Array<{ reps: number; weight?: number }>
): Promise<AISuggestion | null> => {
  if (!isAIConfigured()) {
    return null;
  }

  try {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    const model = import.meta.env.VITE_AI_MODEL || 'x-ai/grok-4-fast:free';
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://glassrevive.app',
        'X-Title': 'GlassRevive Workout Tracker',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a fitness trainer AI assistant. Provide workout suggestions based on exercise history. Respond with JSON format: {"exercise": "name", "sets": number, "reps": number, "weight": number, "notes": "string"}.'
          },
          {
            role: 'user',
            content: `Exercise: ${exercise}. Previous sets: ${JSON.stringify(previousSets)}. Suggest next set.`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      return null;
    }

    // Try to parse JSON response
    try {
      return JSON.parse(content);
    } catch {
      // If not valid JSON, create a basic suggestion
      return {
        exercise,
        sets: previousSets.length + 1,
        reps: previousSets[previousSets.length - 1]?.reps || 10,
        weight: previousSets[previousSets.length - 1]?.weight,
        notes: 'AI suggested based on previous sets'
      };
    }
  } catch (error) {
    console.error('Error generating AI suggestion:', error);
    return null;
  }
};