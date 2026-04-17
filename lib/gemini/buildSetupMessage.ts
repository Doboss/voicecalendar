import { calendarTools } from './toolDeclarations'

export function buildSetupMessage(userTimezone: string) {
  const today = new Date().toISOString().split('T')[0]
  return {
    setup: {
      model: 'models/gemini-2.5-flash-native-audio-latest',
      generationConfig: {
        responseModalities: ['AUDIO'],
      },
      systemInstruction: {
        parts: [
          {
            text: `You are a friendly voice calendar assistant.
Today's date is ${today}. The user's timezone is ${userTimezone}.
Use the provided tools to manage the user's calendar.
- When creating events ask for title, date and time if not provided.
- Confirm details before saving.
- Always confirm before deleting an event.
- When listing events, summarize them clearly.
- Keep responses short and conversational.`,
          },
        ],
      },
      tools: [{ functionDeclarations: calendarTools }],
    },
  }
}
