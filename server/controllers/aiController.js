import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import ChatHistory from '../models/ChatHistory.js';
import * as geminiService from '../utils/geminiService.js';
import { findRelevantChunks } from '../utils/textChunker.js';
import { createRequestLogger } from '../utils/logger.js';

// @desc    Generate flashcards from document
// @route   POST /api/ai/generate-flashcards
// @access  Private
export const generateFlashcards = async (req, res, next) => {
    const log = createRequestLogger('ai.generateFlashcards', req);
    const totalTimer = log.timer('generateFlashcards.total');

    try {
        const { documentId, count = 10 } = req.body;
        log.info('Request received', { documentId, count });

        if (!documentId) {
            totalTimer.end({ status: 'validation_failed' });
            return res.status(400).json({
                success: false,
                error: 'Document ID is required'
            });
        }

        const lookupTimer = log.timer('generateFlashcards.documentLookup', { documentId });
        const document = await Document.findOne({ _id: documentId, userId: req.user._id, status: 'ready' }).lean();
        lookupTimer.end({ found: !!document });

        if (!document) {
            totalTimer.end({ status: 'document_not_found' });
            return res.status(404).json({
                success: false,
                error: 'Document not found'
            });
        }

        // Generate flashcards using Gemini API
        const geminiTimer = log.timer('generateFlashcards.geminiCall', { textLength: document.extractedText?.length || 0 });
        const flashcards = await geminiService.generateFlashcards(document.extractedText, count);
        geminiTimer.end({ flashcardsCount: flashcards.length });

        // Save flashcards to database
        const cards = flashcards;
        const saveTimer = log.timer('generateFlashcards.saveToDatabase', { cardCount: cards.length });
        const flashcardSet = await Flashcard.create({
            userId: req.user._id,
            documentId: document._id,
            cards: cards.map(card => ({
                question: card.question,
                answer: card.answer,
                difficulty: card.difficulty,
                reviewCount: 0,
                isStarred: false
            }))
        });
        saveTimer.end({ flashcardSetId: flashcardSet._id?.toString?.() });

        res.status(200).json({
            success: true,
            data: flashcardSet,
            message: `${flashcards.length} flashcards generated successfully`
        });
        totalTimer.end({ status: 'success' });

    } catch (error) {
        log.error('generateFlashcards failed', { error: error.message });
        totalTimer.end({ status: 'error' });
        next(error);
    }
};

// @desc    Generate quiz from document
// @route   POST /api/ai/generate-quiz
// @access  Private
export const generateQuiz = async (req, res, next) => {
    const log = createRequestLogger('ai.generateQuiz', req);
    const totalTimer = log.timer('generateQuiz.total');

    try {
        const { documentId, numQuestions = 5, title } = req.body;
        log.info('Request received', { documentId, numQuestions, hasCustomTitle: !!title });

        if (!documentId) {
            totalTimer.end({ status: 'validation_failed' });
            return res.status(400).json({
                success: false,
                error: 'Please provide documentId',
                statusCode: 400
            });
        }

        const lookupTimer = log.timer('generateQuiz.documentLookup', { documentId });
        const document = await Document.findOne({
            _id: documentId,
            userId: req.user._id,
            status: 'ready'
        }).lean();
        lookupTimer.end({ found: !!document });

        if (!document) {
            totalTimer.end({ status: 'document_not_found' });
            return res.status(404).json({
                success: false,
                error: 'Document not found or not ready',
                statusCode: 404
            });
        }

        // Generate quiz using Gemini
        const geminiTimer = log.timer('generateQuiz.geminiCall', {
            textLength: document.extractedText?.length || 0,
            numQuestions
        });
        const questions = await geminiService.generateQuiz(
            document.extractedText,
            parseInt(numQuestions, 10)
        );
        geminiTimer.end({ questionCount: questions.length });

        // Save to database
        const saveTimer = log.timer('generateQuiz.saveToDatabase', { questionCount: questions.length });
        const quiz = await Quiz.create({
            userId: req.user._id,
            documentId: document._id,
            title: title || `${document.title} - Quiz`,
            questions: questions,
            totalQuestions: questions.length,
            userAnswers: [],
            score: 0
        });
        saveTimer.end({ quizId: quiz._id?.toString?.() });

        res.status(201).json({
            success: true,
            data: quiz,
            message: 'Quiz generated successfully'
        });
        totalTimer.end({ status: 'success' });

    } catch (error) {
        log.error('generateQuiz failed', { error: error.message });
        totalTimer.end({ status: 'error' });
        next(error)
    }
};

// @desc    Generate document summary
// @route   POST /api/ai/generate-summary
// @access  Private
export const generateSummary = async (req, res, next) => {
    const log = createRequestLogger('ai.generateSummary', req);
    const totalTimer = log.timer('generateSummary.total');

    try {
        const { documentId } = req.body;
        log.info('Request received', { documentId });

        if (!documentId) {
            totalTimer.end({ status: 'validation_failed' });
            return res.status(400).json({
                success: false,
                error: 'Please provide documentId',
                statusCode: 400
            });
        }

        const lookupTimer = log.timer('generateSummary.documentLookup', { documentId });
        const document = await Document.findOne({
            _id: documentId,
            userId: req.user._id,
            status: 'ready'
        }).lean();
        lookupTimer.end({ found: !!document });

        if (!document) {
            totalTimer.end({ status: 'document_not_found' });
            return res.status(404).json({
                success: false,
                error: 'Document not found or not ready',
                statusCode: 404
            });
        }

        // Generate summary using Gemini
        const geminiTimer = log.timer('generateSummary.geminiCall', { textLength: document.extractedText?.length || 0 });
        const summary = await geminiService.generateSummary(document.extractedText);
        geminiTimer.end({ summaryLength: summary?.length || 0 });

        res.status(200).json({
            success: true,
            data: {
                documentId: document._id,
                title: document.title,
                summary
            },
            message: 'Summary generated successfully'
        });
        totalTimer.end({ status: 'success' });
    } catch (error) {
        log.error('generateSummary failed', { error: error.message });
        totalTimer.end({ status: 'error' });
        next(error)
    }
};

// @desc    Chat with document
// @route   POST /api/ai/chat
// @access  Private
export const chat = async (req, res, next) => {
    const log = createRequestLogger('ai.chat', req);
    const totalTimer = log.timer('chat.total');

    try {
        const { documentId, question } = req.body;
        log.info('Request received', {
            documentId,
            questionLength: question?.length || 0
        });

        if (!documentId || !question) {
            totalTimer.end({ status: 'validation_failed' });
            return res.status(400).json({
                success: false,
                error: 'Please provide documentId and question',
                statusCode: 400
            });
        }

        const lookupTimer = log.timer('chat.documentLookup', { documentId });
        const document = await Document.findOne({
            _id: documentId,
            userId: req.user._id,
            status: 'ready'
        }).lean();
        lookupTimer.end({ found: !!document });

        if (!document) {
            totalTimer.end({ status: 'document_not_found' });
            return res.status(404).json({
                success: false,
                error: 'Document not found or not ready',
                statusCode: 404
            });
        }

        // Find relevant chunks
        const chunkTimer = log.timer('chat.findRelevantChunks', { chunkCount: document.chunks?.length || 0 });
        const relevantChunks = findRelevantChunks(document.chunks, question, 3);
        const chunkIndices = relevantChunks.map(c => c.chunkIndex);
        chunkTimer.end({ selectedChunkCount: relevantChunks.length });

        // Get or create chat history
        const historyTimer = log.timer('chat.findOrCreateHistory');
        let chatHistory = await ChatHistory.findOne({
            userId: req.user._id,
            documentId: document._id
        });

        if (!chatHistory) {
            chatHistory = await ChatHistory.create({
                userId: req.user._id,
                documentId: document._id,
                messages: []
            });
        }
        historyTimer.end({ chatHistoryId: chatHistory._id?.toString?.() });

        // Generate response using Gemini
        const geminiTimer = log.timer('chat.geminiCall', { relevantChunkCount: relevantChunks.length });
        const answer = await geminiService.chatWithContext(question, relevantChunks);
        geminiTimer.end({ answerLength: answer?.length || 0 });

        // Save conversation
        const saveTimer = log.timer('chat.saveConversation');
        chatHistory.messages.push(
            {
                role: 'user',
                content: question,
                timestamp: new Date(),
                relevantChunks: []
            },
            {
                role: 'assistant',
                content: answer,
                timestamp: new Date(),
                relevantChunks: chunkIndices
            }
        );

        await chatHistory.save();
        saveTimer.end({ messageCount: chatHistory.messages.length });

        res.status(200).json({
            success: true,
            data: {
                question,
                answer,
                relevantChunks: chunkIndices,
                chatHistoryId: chatHistory._id
            },
            message: 'Response generated successfully'
        });
        totalTimer.end({ status: 'success' });
    } catch (error) {
        log.error('chat failed', { error: error.message });
        totalTimer.end({ status: 'error' });
        next(error)
    }
};

// @desc    Explain concept from document
// @route   POST /api/ai/explain-concept
// @access  Private
export const explainConcept = async (req, res, next) => {
    const log = createRequestLogger('ai.explainConcept', req);
    const totalTimer = log.timer('explainConcept.total');

    try {
        const { documentId, concept } = req.body;
        log.info('Request received', {
            documentId,
            conceptLength: concept?.length || 0
        });

        if (!documentId || !concept) {
            totalTimer.end({ status: 'validation_failed' });
            return res.status(400).json({
                success: false,
                error: 'Please provide documentId and concept',
                statusCode: 400
            });
        }

        const lookupTimer = log.timer('explainConcept.documentLookup', { documentId });
        const document = await Document.findOne({
            _id: documentId,
            userId: req.user._id,
            status: 'ready'
        }).lean();
        lookupTimer.end({ found: !!document });

        if (!document) {
            totalTimer.end({ status: 'document_not_found' });
            return res.status(404).json({
                success: false,
                error: 'Document not found or not ready',
                statusCode: 404
            });
        }

        // Find relevant chunks for the concept
        const chunkTimer = log.timer('explainConcept.findRelevantChunks', { chunkCount: document.chunks?.length || 0 });
        const relevantChunks = findRelevantChunks(document.chunks, concept, 3);
        const context = relevantChunks.map(c => c.content).join('\n\n');
        chunkTimer.end({ selectedChunkCount: relevantChunks.length });

        // Generate explanation using Gemini
        const geminiTimer = log.timer('explainConcept.geminiCall', {
            contextLength: context.length,
            conceptLength: concept.length
        });
        const explanation = await geminiService.explainConcept(concept, context);
        geminiTimer.end({ explanationLength: explanation?.length || 0 });

        res.status(200).json({
            success: true,
            data: {
                concept,
                explanation,
                relevantChunks: relevantChunks.map(c => c.chunkIndex)
            },
            message: 'Explanation generated successfully'
        });
        totalTimer.end({ status: 'success' });
    } catch (error) {
        log.error('explainConcept failed', { error: error.message });
        totalTimer.end({ status: 'error' });
        next(error)
    }
};

// @desc    Get chat history for a document
// @route   GET /api/ai/chat-history/:documentId
// @access  Private
export const getChatHistory = async (req, res, next) => {
    const log = createRequestLogger('ai.getChatHistory', req);
    const totalTimer = log.timer('getChatHistory.total');

    try {
        const { documentId } = req.params;
        log.info('Request received', { documentId });

        if (!documentId) {
            totalTimer.end({ status: 'validation_failed' });
            return res.status(400).json({
                success: false,
                error: 'Please provide documentId',
                statusCode: 400
            });
        }

        const historyTimer = log.timer('getChatHistory.queryHistory', { documentId });
        const chatHistory = await ChatHistory.findOne({
            userId: req.user._id,
            documentId: documentId
        }).select('messages').lean();
        historyTimer.end({ found: !!chatHistory, messageCount: chatHistory?.messages?.length || 0 });

        if (!chatHistory) {
            totalTimer.end({ status: 'success_empty' });
            return res.status(200).json({
                success: true,
                data: [],
                message: 'No chat history found for this document'
            });
        }

        res.status(200).json({
            success: true,
            data: chatHistory.messages,
            message: 'Chat history retrieved successfully'
        });
        totalTimer.end({ status: 'success' });
    } catch (error) {
        log.error('getChatHistory failed', { error: error.message });
        totalTimer.end({ status: 'error' });
        next(error)
    }
};
