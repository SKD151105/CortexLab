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

    } catch (error) {
        // Clean up file on error
        if (req.file) {
            await fs.unlink(req.file.path).catch(err => console.error('Error deleting file:', err));
        }
        next(error);
    }
};

// @desc Get all documents for the authenticated user
// @route GET /api/documents
// @access Private
export const getDocuments = async (req, res, next) => {
    try {
    
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