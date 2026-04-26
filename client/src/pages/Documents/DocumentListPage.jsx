import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Upload, X, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import Button from "../../components/common/Button.jsx";
import DocumentCard from "../../components/documents/DocumentCard.jsx";
import Spinner from "../../components/common/Spinner";
import PaginationControls from "../../components/common/PaginationControls.jsx";
import { queryKeys } from "../../lib/queryKeys.js";
import documentService from "../../services/documentService";

const MAX_UPLOAD_SIZE_BYTES = 40 * 1024 * 1024;
const PAGE_SIZE = 12;

const DocumentListPage = () => {
  const [page, setPage] = useState(1);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const queryClient = useQueryClient();

  const {
    data,
    isLoading: loading,
  } = useQuery({
    queryKey: queryKeys.documents({ page, limit: PAGE_SIZE }),
    queryFn: () => documentService.getDocuments({ page, limit: PAGE_SIZE }),
    placeholderData: (previousData) => previousData,
  });

  const documents = data?.items || [];
  const pagination = data?.pagination;

  const invalidateDocuments = async () => {
    await queryClient.invalidateQueries({
      predicate: ({ queryKey }) =>
        Array.isArray(queryKey) && queryKey[0] === "documents",
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard,
    });
  };

  const uploadMutation = useMutation({
    mutationFn: (formData) => documentService.uploadDocument(formData),
    onSuccess: async () => {
      toast.success("Document uploaded successfully!");
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle("");
      setPage(1);
      await invalidateDocuments();
    },
    onError: (error) => {
      toast.error(error?.message || error?.error || "Upload failed.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => documentService.deleteDocument(id),
    onSuccess: async (_, id) => {
      toast.success(`'${selectedDoc?.title || "Document"}' deleted.`);
      setIsDeleteModalOpen(false);
      setSelectedDoc(null);

      queryClient.setQueryData(
        queryKeys.documents({ page, limit: PAGE_SIZE }),
        (existingData) =>
          existingData
            ? {
                ...existingData,
                items: (existingData.items || []).filter((doc) => doc._id !== id),
              }
            : existingData,
      );

      await invalidateDocuments();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete document.");
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      toast.error("Please select a PDF file.");
      e.target.value = "";
      setUploadFile(null);
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      toast.error("PDF size must be 40MB or less.");
      e.target.value = "";
      setUploadFile(null);
      return;
    }

    setUploadFile(file);
    setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle) {
      toast.error("Please provide a title and select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("title", uploadTitle);
    uploadMutation.mutate(formData);
  };

  const handleDeleteRequest = (doc) => {
    setSelectedDoc(doc);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDoc) return;
    deleteMutation.mutate(selectedDoc._id);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-100">
          <Spinner />
        </div>
      );
    }

    if (documents.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-100">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-linear-to-br from-slate-100 to-slate-200 shadow-lg shadow-slate-200/50 mb-6">
              <FileText
                className="w-10 h-10 text-slate-400"
                strokeWidth={1.5}
              />
            </div>
            <h3 className="text-xl font-medium text-slate-900 tracking-tight mb-2">
              No Documents Yet
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Get started by uploading your first PDF document to begin
              learning.
            </p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Upload Document
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {documents.map((doc) => (
            <DocumentCard
              key={doc._id}
              document={doc}
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
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] opacity-30 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-medium text-slate-900 tracking-tight mb-2">
              My Documents
            </h1>
            <p className="text-slate-500 text-sm">
              Manage and organize your learning materials
            </p>
          </div>
          {(pagination?.totalItems || documents.length) > 0 && (
            <Button onClick={() => setIsUploadModalOpen(true)}>
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Upload Document
            </Button>
          )}
        </div>

        {renderContent()}
      </div>

      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-900/20 p-8">
            <button
              onClick={() => {
                setIsUploadModalOpen(false);
                setUploadFile(null);
                setUploadTitle("");
              }}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-medium text-slate-900 tracking-tight">
                Upload New Document
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Add a PDF document to your library
              </p>
            </div>

            <form onSubmit={handleUpload} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Document Title
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  required
                  className="w-full h-12 px-4 border-2 border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-medium transition-all duration-200 focus:outline-none focus:border-emerald-500 focus:bg-white focus:shadow-lg focus:shadow-emerald-500/10"
                  placeholder="e.g., React Interview Prep"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  PDF File
                </label>
                <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all duration-200">
                  <input
                    id="file-upload"
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleFileChange}
                    accept=".pdf"
                  />
                  <div className="flex flex-col items-center justify-center py-10 px-6">
                    <div className="w-14 h-14 rounded-xl bg-linear-to-r from-emerald-100 to-teal-100 flex items-center justify-center mb-4">
                      <Upload
                        className="w-7 h-7 text-emerald-600"
                        strokeWidth={2}
                      />
                    </div>
                    <p className="text-sm font-medium text-slate-700 mb-1">
                      {uploadFile ? (
                        <span className="text-emerald-600">
                          {uploadFile.name}
                        </span>
                      ) : (
                        <>
                          <span className="text-emerald-600">
                            Click to upload
                          </span>{" "}
                          or drag and drop
                        </>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">PDF up to 40MB</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setUploadFile(null);
                    setUploadTitle("");
                  }}
                  disabled={uploadMutation.isPending}
                  className="flex-1 h-11 px-4 border-2 border-slate-200 rounded-xl bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadMutation.isPending}
                  className="flex-1 h-11 px-4 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {uploadMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    "Upload"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-900/20 p-8">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedDoc(null);
              }}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>

            <div className="mb-6">
              <div className="w-12 h-12 rounded-xl bg-linear-to-r from-red-100 to-red-200 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600" strokeWidth={2} />
              </div>
              <h2 className="text-xl font-medium text-slate-900 tracking-tight">
                Confirm Deletion
              </h2>
            </div>

            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete the document:{" "}
              <span className="font-semibold text-slate-900">
                {selectedDoc?.title}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedDoc(null);
                }}
                disabled={deleteMutation.isPending}
                className="flex-1 h-11 px-4 border-2 border-slate-200 rounded-xl bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 h-11 px-4 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {deleteMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentListPage;
