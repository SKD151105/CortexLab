import fs from 'fs/promises';
import { PDFParse } from 'pdf-parse';

const DEFAULT_MAX_FILE_SIZE = 40 * 1024 * 1024;
const DEFAULT_PARSE_TIMEOUT_MS = 20000;

const runWithTimeout = async (promise, timeoutMs) => {
    let timer;
    try {
        return await Promise.race([
            promise,
            new Promise((_, reject) => {
                timer = setTimeout(() => {
                    reject(new Error(`PDF parsing timed out after ${timeoutMs}ms`));
                }, timeoutMs);
            }),
        ]);
    } finally {
        if (timer) clearTimeout(timer);
    }
};

/** 
 * Extract text content from a PDF file
 * @param {string} filePath - The path to the PDF file
 * @returns {Promise<{ text: string, numPages: number }>} - The extracted text content
 */
export const extractTextFromPDF = async (filePath) => {
    try {
        const maxFileSize = Number.parseInt(process.env.MAX_FILE_SIZE || '', 10) || DEFAULT_MAX_FILE_SIZE;
        const parseTimeoutMs = Number.parseInt(process.env.PDF_PARSE_TIMEOUT_MS || '', 10) || DEFAULT_PARSE_TIMEOUT_MS;

        const fileStats = await fs.stat(filePath);
        if (fileStats.size > maxFileSize) {
            throw new Error(`PDF exceeds allowed size limit of ${maxFileSize} bytes`);
        }

        const dataBuffer = await fs.readFile(filePath);
        // PDFParse expects a Uint8Array, so we convert the Buffer explicitly.
        const parser = new PDFParse(new Uint8Array(dataBuffer));
        const data = await runWithTimeout(parser.getText(), parseTimeoutMs);
        const extractedText = typeof data.text === 'string' ? data.text : '';

        return {
            text: extractedText,
            numPages: data.numpages,
            info: data.info,
        };

    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error('Failed to extract text from PDF');
    }
};