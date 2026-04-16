import { calendarTools } from './toolDeclarations'

export function buildSetupMessage(userTimezone: string) {
  const today = new Date().toISOString().split('T')[0]
  return {
    setup: {
      model: 'models/gemini-2.5-flash-preview-native-audio-dialog',
      tools: [{ functionDeclarations: calendarTools }],
      system_instruction: {
        parts: [
          {
            text: `You are a friendly and helpful calendar assistant.
Today's date is ${today}. The user's timezone is ${userTimezone}.
You have access to tools to manage the user's calendar.
- When creating events, confirm the details back to the user.
- Always confirm before deleting an event.
- When listing or searching events, summarize them clearly.
- Be concise and conversational in your responses.`,
          },
        ],
      },
      generation_config: {
        response_modalities: ['AUDIO'],
        speech_config: {
          voice_config: {
            prebuilt_voice_config: { voice_name: 'Aoede' },
          },
        },
      },
    },
  }
}
