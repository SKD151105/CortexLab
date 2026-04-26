import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "../../components/common/PageHeader";
import Spinner from "../../components/common/Spinner";
import EmptyState from "../../components/common/EmptyState";
import FlashcardSetCard from "../../components/flashcards/FlashcardSetCard";
import PaginationControls from "../../components/common/PaginationControls";
import { queryKeys } from "../../lib/queryKeys";
import flashcardService from "../../services/flashcardService";

const PAGE_SIZE = 12;

const FlashcardsListPage = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading: loading } = useQuery({
    queryKey: queryKeys.flashcardSets({ page, limit: PAGE_SIZE }),
    queryFn: () =>
      flashcardService.getAllFlashcardSets({
        page,
        limit: PAGE_SIZE,
      }),
    placeholderData: (previousData) => previousData,
  });

  const flashcardSets = data?.items || [];
  const pagination = data?.pagination;

  const renderContent = () => {
    if (loading) {
      return <Spinner />;
    }

    if (flashcardSets.length === 0) {
      return (
        <EmptyState
          title="No Flashcard Sets Found"
          description="You haven't generated any flashcards yet. Go to a document to create your first set."
        />
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {flashcardSets.map((set) => (
            <FlashcardSetCard key={set._id} flashcardSet={set} />
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
    <div>
      <PageHeader title="All Flashcard Sets" />
      {renderContent()}
    </div>
  );
};

export default FlashcardsListPage;
