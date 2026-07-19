/**
 * Deterministic, dependency-free "local" provider. Active by default
 * (AI_PROVIDER=local) so the whole AI surface area (tutor, chat-with-book,
 * flashcard generation, remediation) is fully exercisable — including in CI
 * and for frontend integration — without any external API key or the
 * on-device Gemma runtime being available. Swap AI_PROVIDER to point at a
 * real cloud provider or a Gemma/LiteRT-LM proxy without touching callers.
 */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const localProvider = {
  async chat(messages) {
    const last = messages[messages.length - 1]?.content || "";
    return `Here's my take on "${last.slice(0, 120)}": ${pick([
      "Let's break this down step by step.",
      "Good question — the key idea here is understanding the underlying concept first.",
      "Think of it this way, using a simple example.",
    ])} (This is a placeholder reply from the local AI provider — connect a real provider via AI_PROVIDER.)`;
  },

  async remediate(context) {
    const { subject, topic, questionStem, studentChosenOption, correctOption, masteryScore } = context;
    return {
      explanation: `In ${subject} (${topic}), the correct answer is "${correctOption}". You chose "${studentChosenOption}" — a common point of confusion here is mixing up related concepts, so let's revisit the core idea behind "${questionStem?.slice(0, 80)}".`,
      misconceptionSummary: `Likely confused the definition or process tested by this question.`,
      mnemonic: `Remember: ${topic} → think "${correctOption?.slice(0, 24)}" first.`,
      followUpQuestion: {
        stem: `Quick check: which statement best matches the idea behind "${topic}"?`,
        options: [correctOption, studentChosenOption, "None of the above", "All of the above"].filter(Boolean),
        correctIndex: 0,
      },
      difficultyAdjustment: masteryScore >= 0.7 ? "harder" : masteryScore <= 0.3 ? "easier" : "same",
    };
  },

  async mnemonic(concept, subject) {
    return `For "${concept}" in ${subject}: picture the first letters spelling out the key steps — a quick memory hook to recall it under exam pressure.`;
  },
};
