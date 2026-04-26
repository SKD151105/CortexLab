export const queryKeys = {
  dashboard: ["dashboard"],
  documents: (params = {}) => ["documents", params],
  document: (id) => ["document", id],
  flashcardSets: (params = {}) => ["flashcard-sets", params],
  flashcardsForDocument: (documentId, params = {}) => [
    "flashcards",
    documentId,
    params,
  ],
  quizzesForDocument: (documentId, params = {}) => [
    "quizzes",
    documentId,
    params,
  ],
  quizResults: (quizId) => ["quiz-results", quizId],
};
