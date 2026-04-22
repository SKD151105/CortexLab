import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";
import { extractTextFromPDF } from "../utils/pdfParser.js";
import { chunkText } from "../utils/textChunker.js";
import fs from "fs/promises";
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
            filename: req.file.originalname,
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
        // Clean up file on error
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

        // Create chunks
        const chunks = chunkText(text, 500, 50); // Adjust chunk size as needed

        // Update document 
        await Document.findByIdAndUpdate(documentId, {
            extractedText: text,
            chunks: chunks,
            status: 'processed'
        });

        console.log(`Document ${documentId} processed successfully with ${chunks.length} chunks`);

        // Clean up file after processing
        await fs.unlink(filePath).catch(err => console.error('Error deleting file:', err));
    } catch (error) {
        console.error('Error in processPDF:', error);

        // Update document status to failed on error
        await Document.findByIdAndUpdate(documentId, { status: 'failed' }).catch(err => console.error('Error updating document status:', err));

        // Clean up file on error
        await fs.unlink(filePath).catch(err => console.error('Error deleting file:', err));
    }
};


// @desc Get all documents for the authenticated user
// @route GET /api/documents
// @access Private
export const getDocuments = async (req, res, next) => {
    try {
        const documents = await Document.aggregate([
            { $match: { userId: mongoose.Types.ObjectId(req.user._id) } },
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

    } catch (error) {
        next(error);
    }
};

// @desc Delete a document by ID
// @route DELETE /api/documents/:id
// @access Private
export const deleteDocument = async (req, res, next) => {
    try {

    } catch (error) {
        next(error);
    }
};

// @desc Update a document by ID (replace file)
// @route PUT /api/documents/:id
// @access Private
export const updateDocument = async (req, res, next) => {
    try {

    } catch (error) {
        // Clean up file on error
        if (req.file) {
            await fs.unlink(req.file.path).catch(err => console.error('Error deleting file:', err));
        }
        next(error);
    }
};