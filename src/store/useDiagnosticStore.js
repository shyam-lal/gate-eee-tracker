import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useDiagnosticStore = create(
  persist(
    (set, get) => ({
      subjectId: null,
      subjectName: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: {}, // questionId -> selectedOptionId
      timePerQuestion: {}, // questionId -> seconds
      isCompleted: false,
      startTime: null,

      initDiagnostic: (subjectId, subjectName, questions) => set({
        subjectId,
        subjectName,
        questions,
        currentQuestionIndex: 0,
        answers: {},
        timePerQuestion: {},
        isCompleted: false,
        startTime: Date.now()
      }),

      setAnswer: (questionId, optionId, timeSpent) => set((state) => ({
        answers: { ...state.answers, [questionId]: optionId },
        timePerQuestion: { ...state.timePerQuestion, [questionId]: (state.timePerQuestion[questionId] || 0) + timeSpent }
      })),

      nextQuestion: () => set((state) => {
        if (state.currentQuestionIndex < state.questions.length - 1) {
          return { currentQuestionIndex: state.currentQuestionIndex + 1, startTime: Date.now() };
        } else {
          return { isCompleted: true };
        }
      }),

      prevQuestion: () => set((state) => ({
        currentQuestionIndex: Math.max(0, state.currentQuestionIndex - 1),
        startTime: Date.now()
      })),

      reset: () => set({
        subjectId: null,
        subjectName: null,
        questions: [],
        currentQuestionIndex: 0,
        answers: {},
        timePerQuestion: {},
        isCompleted: false,
        startTime: null
      }),
      
      calculateResults: () => {
        const state = get();
        let score = 0;
        let weakModules = [];
        const resultAnswers = [];

        state.questions.forEach(q => {
          const selected = state.answers[q.id];
          const isCorrect = selected === q.correct_option_id;
          const timeSeconds = state.timePerQuestion[q.id] || 0;
          
          if (isCorrect) {
            score += 1;
          } else {
            weakModules.push(q.topic_name || q.topic_slug);
          }

          resultAnswers.push({
            questionId: q.id,
            selectedOptionId: selected,
            isCorrect,
            timeSeconds
          });
        });

        // Save to localStorage exactly as requested by backend/dashboard logic
        const payload = {
          subjectId: state.subjectId,
          subjectName: state.subjectName,
          score,
          total: state.questions.length,
          weakModules: [...new Set(weakModules)],
          answers: resultAnswers,
          timestamp: Date.now()
        };

        localStorage.setItem('vault_guest_diagnostic', JSON.stringify(payload));
        return payload;
      }
    }),
    {
      name: 'diagnostic-storage', 
      partialize: (state) => ({ 
        subjectId: state.subjectId, 
        subjectName: state.subjectName,
        questions: state.questions,
        answers: state.answers,
        timePerQuestion: state.timePerQuestion,
        currentQuestionIndex: state.currentQuestionIndex
      }), // only persist necessary data if user refreshes mid-quiz
    }
  )
);
