import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";
import { extractTextFromPDF } from "../utils/pdfParser.js";
import { chunkText } from "../utils/textChunker.js";
import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";

// @desc Upload PDF document
// @route POST /api/documents/upload
// @access Private
export const uploadDocument = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        const { title } = req.body || {};
        if (!title) {
            // Clean up uploaded file if title is missing
            await fs.unlink(req.file.path).catch(err => console.error('Error deleting file:', err));
            return res.status(400).json({
                success: false,
                error: 'Title is required'
            });
        }

        // Construct URL for the uploaded file
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

        // Create document record in the database
        const document = await Document.create({
            userId: req.user._id,
            title,
            fileName: req.file.originalname,
            filePath: fileUrl, // Store the URL instead of the local path
            fileSize: req.file.size,
            status: 'processing'
        });

        // Process the PDF in the background (in production, consider using a job queue like Bull)
        processPDF(document._id, req.file.path).catch(err => {
            console.error('Error processing PDF:', err);
            // Update document status to failed on error
            Document.findByIdAndUpdate(document._id, { status: 'failed' }).catch(err => console.error('Error updating document status:', err));

            // Clean up file on error            
            fs.unlink(req.file.path).catch(err => console.error('Error deleting file:', err));
        });

        res.status(201).json({
            success: true,
            data: document,
            message: 'Document uploaded successfully and is being processed'
        });

    } catch (error) {
        if (req.file) {
            await fs.unlink(req.file.path).catch(err => console.error('Error deleting file:', err));
        }
        next(error);
    }
};

// Helper function to process PDF, extract text, chunk it, and update the document record
const processPDF = async (documentId, filePath) => {
    try {
        const { text } = await extractTextFromPDF(filePath);
        const chunks = chunkText(text, 500, 50);

        // Update document 
        await Document.findByIdAndUpdate(documentId, {
            extractedText: text,
            chunks: chunks,
            status: 'ready'
        });

        console.log(`Document ${documentId} processed successfully with ${chunks.length} chunks`);
        await fs.unlink(filePath).catch(err => console.error('Error deleting file:', err));

    } catch (error) {
        console.error('Error in processPDF:', error);

        // Update document status to failed on error
        await Document.findByIdAndUpdate(documentId, { status: 'failed' }).catch(err => console.error('Error updating document status:', err));
        await fs.unlink(filePath).catch(err => console.error('Error deleting file:', err));
    }
};


// @desc Get all documents for the authenticated user
// @route GET /api/documents
// @access Private
export const getDocuments = async (req, res, next) => {
    try {
        const documents = await Document.aggregate([
            { $match: { userId: req.user._id } },
            {
                $lookup: {
                    from: 'flashcards',
                    localField: '_id',
                    foreignField: 'documentId',
                    as: 'flashcardSets'
                }
            },
            {
                $lookup: {
                    from: 'quizzes',
                    localField: '_id',
                    foreignField: 'documentId',
                    as: 'quizzes'
                }
            },
            {
                $addFields: {
                    flashcardCount: { $size: '$flashcardSets' },
                    quizCount: { $size: '$quizzes' }
                }
            },
            {
                $project: {
                    extractedText: 0,
                    chunks: 0,
                    flashcardSets: 0,
                    quizzes: 0
                }
            },
            { $sort: { uploadDate: -1 } }
        ]);

        res.status(200).json({
            success: true,
            count: documents.length,
            data: documents
        });

    } catch (error) {
        next(error);
    }
};

// @desc Get a single document by ID
// @route GET /api/documents/:id
// @access Private
export const getDocument = async (req, res, next) => {
    try {
        const document = await Document.findOne({ _id: req.params.id, userId: req.user._id });
        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found'
            });
        }

        // Get counts of associated flashcard sets and quizzes
        const flashcardCount = await Flashcard.countDocuments({ documentId: document._id, userId: req.user._id });
        const quizCount = await Quiz.countDocuments({ documentId: document._id, userId: req.user._id });

        // Update last accessed date
        document.lastAccessed = Date.now();
        await document.save();

        // Combine document data with counts
        const documentData = document.toObject();
        documentData.flashcardCount = flashcardCount;
        documentData.quizCount = quizCount;

        res.status(200).json({
            success: true,
            data: documentData
        });

    } catch (error) {
        next(error);
    }
};

// @desc Delete a document by ID
// @route DELETE /api/documents/:id
// @access Private
export const deleteDocument = async (req, res, next) => {
    try {
        const document = await Document.findOne({ _id: req.params.id, userId: req.user._id });
        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found'
            });
        }

        // Delete file from file system
        let fileToDelete = document.filePath;
        if (/^https?:\/\//i.test(fileToDelete)) {
            try {
                const { pathname } = new URL(fileToDelete);
                if (pathname.startsWith('/uploads/')) {
                    const relativeUploadPath = pathname.replace('/uploads/', 'uploads/');
                    fileToDelete = path.join(process.cwd(), decodeURIComponent(relativeUploadPath));
                } else {
                    fileToDelete = null;
                }
            } catch {
                fileToDelete = null;
            }
        }

        if (fileToDelete) {
            await fs.unlink(fileToDelete).catch(err => console.error('Error deleting file:', err));
        }

        // Delete document record from database
        await Document.deleteOne({ _id: document._id, userId: req.user._id });

        // Delete associated flashcard sets and quizzes
        await Flashcard.deleteMany({ documentId: document._id, userId: req.user._id });
        await Quiz.deleteMany({ documentId: document._id, userId: req.user._id });

        res.status(200).json({
            success: true,
            message: 'Document and associated data deleted successfully'
        });

    } catch (error) {
        next(error);
    }
};
