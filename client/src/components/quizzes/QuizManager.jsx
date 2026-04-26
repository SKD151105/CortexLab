import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

import quizService from "../../services/quizService.js";
import aiService from "../../services/aiService.js";
import Spinner from "../common/Spinner.jsx";
import Button from "../common/Button.jsx";
import Modal from "../common/Modal.jsx";
import QuizCard from "./QuizCard.jsx";
import EmptyState from "../common/EmptyState.jsx";
import PaginationControls from "../common/PaginationControls.jsx";
import { queryKeys } from "../../lib/queryKeys.js";

const PAGE_SIZE = 8;

const QuizManager = ({ documentId }) => {
  const [page, setPage] = useState(1);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading: loading } = useQuery({
    queryKey: queryKeys.quizzesForDocument(documentId, {
      page,
      limit: PAGE_SIZE,
    }),
    queryFn: () =>
      quizService.getQuizzesForDocument(documentId, {
        page,
        limit: PAGE_SIZE,
      }),
    enabled: Boolean(documentId),
    placeholderData: (previousData) => previousData,
  });

  const quizzes = data?.items || [];
  const pagination = data?.pagination;

  const invalidateQuizzes = async () => {
    await queryClient.invalidateQueries({
      predicate: ({ queryKey }) =>
        Array.isArray(queryKey) &&
        queryKey[0] === "quizzes" &&
        queryKey[1] === documentId,
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard,
    });
  };

  const generateMutation = useMutation({
    mutationFn: () => aiService.generateQuiz(documentId, { numQuestions }),
    onSuccess: async () => {
      toast.success("Quiz generated successfully!");
      setIsGenerateModalOpen(false);
      setPage(1);
      await invalidateQuizzes();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate quiz.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (quizId) => quizService.deleteQuiz(quizId),
    onSuccess: async (_, quizId) => {
      toast.success(`'${selectedQuiz?.title || "Quiz"}' deleted.`);
      setIsDeleteModalOpen(false);
      setSelectedQuiz(null);

      queryClient.setQueryData(
        queryKeys.quizzesForDocument(documentId, { page, limit: PAGE_SIZE }),
        (existingData) =>
          existingData
            ? {
                ...existingData,
                items: (existingData.items || []).filter((quiz) => quiz._id !== quizId),
              }
            : existingData,
      );

      await invalidateQuizzes();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete quiz.");
    },
  });

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    generateMutation.mutate();
  };

  const handleDeleteRequest = (quiz) => {
    setSelectedQuiz(quiz);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedQuiz) return;
    deleteMutation.mutate(selectedQuiz._id);
  };

  const renderQuizContent = () => {
    if (loading) {
      return <Spinner />;
    }

    if (quizzes.length === 0) {
      return (
        <EmptyState
          title="No Quizzes Yet"
          description="Generate a quiz from your document to test your knowledge."
        />
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {quizzes.map((quiz) => (
            <QuizCard
              key={quiz._id}
              quiz={quiz}
              documentId={documentId}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
        <PaginationControls
          page={pagination?.page || page}
          totalPages={pagination?.totalPages || 1}
          hasNextPage={pagination?.hasNextPage}
          hasPreviousPage={pagination?.hasPreviousPage}
          onPageChange={setPage}
        />
      </>
    );
  };

  return (
    <div className=" bg-white border border-neutral-200 rounded-lg p-6">
      <div className="flex justify-end gap-2 mb-4">
        <Button onClick={() => setIsGenerateModalOpen(true)}>
          <Plus size={16} />
          Generate Quiz
        </Button>
      </div>

      {renderQuizContent()}

      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate New Quiz"
      >
        <form onSubmit={handleGenerateQuiz} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              Number of Questions
            </label>
            <input
              type="number"
              value={numQuestions}
              onChange={(e) =>
                setNumQuestions(Math.max(1, parseInt(e.target.value, 10) || 1))
              }
              min="1"
              required
              className="w-full h-9 px-3 border border-neutral-200 rounded-lg bg-white text-sm text-neutral-900 placeholder-neutral-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#00d492] focus:border-transparent"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsGenerateModalOpen(false)}
              disabled={generateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={generateMutation.isPending}>
              {generateMutation.isPending ? "Generating..." : "Generate"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete Quiz"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Are you sure you want to delete the quiz:{" "}
            <span className="font-semibold text-neutral-900">
              {selectedQuiz?.title || "this quiz"}
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-500 hover:bg-red-600 active:bg-red-700 focus:ring-red-500"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QuizManager;
