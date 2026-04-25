import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";
import { createLogger } from './logger.js';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const logger = createLogger('gemini-service');
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 45000);

const withTimeout = async (promise, timeoutMs, label) => {
	let timeoutRef;
	const timeoutPromise = new Promise((_, reject) => {
		timeoutRef = setTimeout(() => {
			reject(new Error(`${label} timed out after ${timeoutMs}ms`));
		}, timeoutMs);
	});

	try {
		return await Promise.race([promise, timeoutPromise]);
	} finally {
		clearTimeout(timeoutRef);
	}
};

if (!process.env.GEMINI_API_KEY) {
	console.error('FATAL ERROR: GEMINI_API_KEY is not set in the environment variables.');
	process.exit(1);
}

/**
 * Generate flashcards from text
 * @param {string} text - Document text
 * @param {number} count - Number of flashcards to generate
 * @returns {Promise<Array<{question: string, answer: string, difficulty: string}>>}
 */
export const generateFlashcards = async (text, count = 10) => {
	const timer = logger.timer('generateFlashcards', {
		count,
		textLength: text?.length || 0
	});

	const prompt = `Generate exactly ${count} educational flashcards from the following text.
Format each flashcard as:
Q: [Clear, specific question]
A: [Concise, accurate answer]
D: [Difficulty level: easy, medium, or hard]

Separate each flashcard with "___"

Text:
${text.substring(0, 15000)}`;

	try {
		const response = await withTimeout(ai.models.generateContent({
			model: "gemini-2.5-flash-lite",
			contents: prompt,
		}), GEMINI_TIMEOUT_MS, 'generateFlashcards');

		const generatedText = response.text;

		// Parse the response
		const flashcards = [];
		const cards = generatedText.split('___').filter(c => c.trim());

		for (const card of cards) {
			const lines = card.trim().split('\n');
			let question = '', answer = '', difficulty = 'medium';

			for (const line of lines) {
				if (line.startsWith('Q:')) {
					question = line.substring(2).trim();
				} else if (line.startsWith('A:')) {
					answer = line.substring(2).trim();
				} else if (line.startsWith('D:')) {
					const diff = line.substring(2).trim().toLowerCase();
					if (['easy', 'medium', 'hard'].includes(diff)) {
						difficulty = diff;
					}
				}
			}

			if (question && answer) {
				flashcards.push({ question, answer, difficulty });
			}
		}

		const result = flashcards.slice(0, count);
		timer.end({
			resultCount: result.length,
			status: 'success'
		});
		return result;
	} catch (error) {
		logger.error('Gemini API error in generateFlashcards', {
			error: error.message
		});
		timer.end({ status: 'error' });
		throw new Error('Failed to generate flashcards');
	}
};

/**
 * Generate quiz questions
 * @param {string} text - Document text
 * @param {number} numQuestions - Number of questions
 * @returns {Promise<Array<{question: string, options: Array, correctAnswer: string, explanation: string, difficulty: string}>>}
 */
export const generateQuiz = async (text, numQuestions = 5) => {
	const timer = logger.timer('generateQuiz', {
		numQuestions,
		textLength: text?.length || 0
	});

	const prompt = `Generate exactly ${numQuestions} multiple choice questions from the following text.
Format each question as:
Q: [Question]
O1: [Option 1]
O2: [Option 2]
O3: [Option 3]
O4: [Option 4]
C: [Correct option - exactly as written above]
E: [Brief explanation]
D: [Difficulty: easy, medium, or hard]

Separate questions with "___"

Text:
${text.substring(0, 15000)}`;

	try {
		const response = await withTimeout(ai.models.generateContent({
			model: "gemini-2.5-flash-lite",
			contents: prompt,
		}), GEMINI_TIMEOUT_MS, 'generateQuiz');

		const generatedText = response.text;

		const questions = [];
		const questionBlocks = generatedText.split('___').filter(q => q.trim());

		for (const block of questionBlocks) {
			const lines = block.trim().split('\n');
			let question = '', options = [], correctAnswer = '', explanation = '', difficulty = 'medium';

			for (const line of lines) {
				const trimmed = line.trim();
				if (trimmed.startsWith('Q:')) {
					question = trimmed.substring(2).trim();
				} else if (trimmed.match(/^O\d:/)) {
					options.push(trimmed.substring(3).trim());
				} else if (trimmed.startsWith('C:')) {
					correctAnswer = trimmed.substring(2).trim();
				} else if (trimmed.startsWith('E:')) {
					explanation = trimmed.substring(2).trim();
				} else if (trimmed.startsWith('D:')) {
					const diff = trimmed.substring(2).trim().toLowerCase();
					if (['easy', 'medium', 'hard'].includes(diff)) {
						difficulty = diff;
					}
				}
			}

			if (question && options.length === 4 && correctAnswer) {
				questions.push({ question, options, correctAnswer, explanation, difficulty });
			}
		}

		const result = questions.slice(0, numQuestions);
		timer.end({
			resultCount: result.length,
			status: 'success'
		});
		return result;
	} catch (error) {
		logger.error('Gemini API error in generateQuiz', {
			error: error.message
		});
		timer.end({ status: 'error' });
		throw new Error('Failed to generate quiz');
	}
};

/**
 * Generate document summary
 * @param {string} text - Document text
 * @returns {Promise<string>}
 */
export const generateSummary = async (text) => {
	const timer = logger.timer('generateSummary', {
		textLength: text?.length || 0
	});

	const prompt = `Provide a concise summary of the following text, highlighting the key concepts, main ideas, and important points.
Keep the summary clear and structured.

Text:
${text.substring(0, 20000)}`;

	try {
		const response = await withTimeout(ai.models.generateContent({
			model: "gemini-2.5-flash-lite",
			contents: prompt,
		}), GEMINI_TIMEOUT_MS, 'generateSummary');
		const generatedText = response.text;
		timer.end({
			responseLength: generatedText?.length || 0,
			status: 'success'
		});
		return generatedText
	} catch (error) {
		logger.error('Gemini API error in generateSummary', {
			error: error.message
		});
		timer.end({ status: 'error' });
		throw new Error('Failed to generate summary');
	}
};

/**
 * Chat with document context
 * @param {string} question - User question
 * @param {Array<Object>} chunks - Relevant document chunks
 * @returns {Promise<string>}
 */
export const chatWithContext = async (question, chunks) => {
	const timer = logger.timer('chatWithContext', {
		questionLength: question?.length || 0,
		chunkCount: chunks?.length || 0
	});

	const context = chunks.map((c, i) => `[Chunk ${i + 1}]\n${c.content}`).join('\n\n');

	const prompt = `Based on the following context from a document, Analyse the context and answer the user's question.
If the answer is not in the context, say so.

Context:
${context}

Question: ${question}

Answer:`;

	try {
		const response = await withTimeout(ai.models.generateContent({
			model: "gemini-2.5-flash-lite",
			contents: prompt,
		}), GEMINI_TIMEOUT_MS, 'chatWithContext');
		const generatedText = response.text;
		timer.end({
			responseLength: generatedText?.length || 0,
			status: 'success'
		});
		return generatedText
	} catch (error) {
		logger.error('Gemini API error in chatWithContext', {
			error: error.message
		});
		timer.end({ status: 'error' });
		throw new Error('Failed to process chat request');
	}
};

/**
 * Explain a specific concept
 * @param {string} concept - Concept to explain
 * @param {string} context - Relevant context
 * @returns {Promise<string>}
 */
export const explainConcept = async (concept, context) => {
	const timer = logger.timer('explainConcept', {
		conceptLength: concept?.length || 0,
		contextLength: context?.length || 0
	});

	const prompt = `Explain the concept of "${concept}" based on the following context.
Provide a clear, educational explanation that's easy to understand.
Include examples if relevant.

Context:
${context.substring(0, 10000)}`;

	try {
		const response = await withTimeout(ai.models.generateContent({
			model: "gemini-2.5-flash-lite",
			contents: prompt,
		}), GEMINI_TIMEOUT_MS, 'explainConcept');
		const generatedText = response.text;
		timer.end({
			responseLength: generatedText?.length || 0,
			status: 'success'
		});
		return generatedText
	} catch (error) {
		logger.error('Gemini API error in explainConcept', {
			error: error.message
		});
		timer.end({ status: 'error' });
		throw new Error('Failed to explain concept');
	}
};
