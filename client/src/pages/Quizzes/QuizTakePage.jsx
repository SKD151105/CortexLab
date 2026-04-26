import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import quizService from "../../services/quizService";
import PageHeader from "../../components/common/PageHeader";
import Spinner from "../../components/common/Spinner";
import toast from "react-hot-toast";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";

const QuizTakePage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [isQuitModalOpen, setIsQuitModalOpen] = useState(false);
  const returnTo = searchParams.get("returnTo");

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await quizService.getQuizById(quizId);
        setQuiz(response.data);
      } catch (error) {
        toast.error("Failed to fetch quiz.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleOptionChange = (questionId, optionIndex) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    const formattedAnswers = Object.keys(selectedAnswers)
      .map((questionId) => {
        const question = quiz.questions.find((q) => q._id == questionId);
        const questionIndex = quiz.questions.findIndex((q) => q._id == questionId);
        const optionIndex = selectedAnswers[questionId];

        if (!question || questionIndex < 0 || optionIndex === undefined) {
          return null;
        }

        const selectedAnswer = question.options[optionIndex];
        return { questionIndex, selectedAnswer };
      })
      .filter(Boolean);

    if (formattedAnswers.length === 0) {
      toast.error("Please answer at least one question before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      await quizService.submitQuiz(quizId, formattedAnswers);
      toast.success("Quiz submitted successfully.");
      const resultsPath = returnTo
        ? `/quizzes/${quizId}/results?returnTo=${encodeURIComponent(returnTo)}`
        : `/quizzes/${quizId}/results`;
      navigate(resultsPath);
    } catch (error) {
      toast.error(error?.message || "Failed to submit quiz.");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackClick = () => {
    setIsQuitModalOpen(true);
  };

  const handleConfirmQuit = () => {
    setIsQuitModalOpen(false);
    if (returnTo) {
      navigate(returnTo);
      return;
    }

    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-slate-600 text-lg">
            Quiz not found or has no questions.
          </p>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="max-w-4xl mx-auto">
      <button
        type="button"
        onClick={handleBackClick}
        className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors mb-4"
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
        Back
      </button>

      <PageHeader title={quiz.title || "Take Quiz"} />

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </span>
          <span className="text-sm font-medium text-slate-500">
            {answeredCount} answered
          </span>
        </div>
        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-linear-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 p-6 mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl mb-6">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-emerald-700">
            Question {currentQuestionIndex + 1}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-6 leading-relaxed">
          {currentQuestion.question}
        </h3>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswers[currentQuestion._id] === index;

            return (
              <label
                key={index}
                className={`group relative flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/10"
                    : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white hover:shadow-md"
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion._id}`}
                  value={index}
                  checked={isSelected}
                  onChange={() =>
                    handleOptionChange(currentQuestion._id, index)
                  }
                  className="sr-only"
                />

                <div
                  className={`shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-slate-300 bg-white group-hover:border-emerald-400"
                  }`}
                >
                  {isSelected && (
                    <div className="flex items-center justify-center w-full h-full">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </div>

                <span
                  className={`ml-4 text-sm font-medium transition-colors duration-200 ${
                    isSelected
                      ? "text-emerald-900"
                      : "text-slate-700 group-hover:text-slate-900"
                  }`}
                >
                  {option}
                </span>

                {isSelected && (
                  <CheckCircle2
                    className="ml-auto w-5 h-5 text-emerald-600"
                    strokeWidth={2.5}
                  />
                )}
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Button
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0 || submitting}
          variant="secondary"
        >
          <ChevronLeft
            className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200"
            strokeWidth={2.5}
          />
          Previous
        </Button>

        {currentQuestionIndex === quiz.questions.length - 1 ? (
          <button
            onClick={handleSubmitQuiz}
            disabled={submitting}
            className="group relative px-8 h-12 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                  Submit Quiz
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </button>
        ) : (
          <Button onClick={handleNextQuestion} disabled={submitting}>
            Next
            <ChevronRight
              className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200"
              strokeWidth={2.5}
            />
          </Button>
        )}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
        {quiz.questions.map((_, index) => {
          const isAnsweredQuestion = Object.prototype.hasOwnProperty.call(
            selectedAnswers,
            quiz.questions[index]._id,
          );
          const isCurrent = index === currentQuestionIndex;

          return (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              disabled={submitting}
              className={`w-8 h-8 rounded-lg font-semibold text-xs transition-all duration-200 ${
                isCurrent
                  ? "bg-linear-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 scale-110"
                  : isAnsweredQuestion
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <Modal
        isOpen={isQuitModalOpen}
        onClose={() => setIsQuitModalOpen(false)}
        title=""
        panelClassName="max-w-md"
      >
        <div className="space-y-6">
          <div className="w-12 h-12 rounded-xl bg-linear-to-r from-amber-100 to-orange-100 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-amber-600" strokeWidth={2} />
          </div>

          <p className="text-sm text-slate-600">
            Are you sure you want to qiut without completing the quiz
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsQuitModalOpen(false)}
              className="flex-1 h-11 px-4 border-2 border-slate-200 rounded-xl bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmQuit}
              className="flex-1 h-11 px-4 bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/25 active:scale-[0.98]"
            >
              Quit
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QuizTakePage;
