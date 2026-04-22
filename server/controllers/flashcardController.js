import Flashcard from '../models/Flashcard.js';

// @desc    Get all flashcards for a document
// @route   GET /api/flashcards/:documentId
// @access  Private
export const getFlashcards = async (req, res, next) => {
    try {
        const flashcards = await Flashcard.find({
            userId: req.user._id,
            documentId: req.params.documentId
        })
            .populate('documentId', 'title fileName')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: flashcards.length,
            data: flashcards
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get all flashcard sets for a user
// @route   GET /api/flashcards
// @access  Private
export const getAllFlashcardSets = async (req, res, next) => {
    try {
        const flashcardSets = await Flashcard.find({ userId: req.user._id })
            .populate('documentId', 'title')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: flashcardSets.length,
            data: flashcardSets
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Mark flashcard as reviewed
// @route   POST /api/flashcards/:cardId/review
// @access  Private
export const reviewFlashcard = async (req, res, next) => {
    try {
        const flashcardSet = await Flashcard.findOne({ 'cards._id': req.params.cardId, userId: req.user._id });

        if (!flashcardSet) {
            return res.status(404).json({
                success: false,
                error: 'Flashcard not found'
            });
        }

        const cardIndex = flashcardSet.cards.findIndex(card => card._id.toString() === req.params.cardId);

        if (cardIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Flashcard not found'
            });
        }

        // Update review count and last reviewed date
        flashcardSet.cards[cardIndex].reviewCount += 1;
        flashcardSet.cards[cardIndex].lastReviewed = new Date();

        await flashcardSet.save();

        res.status(200).json({
            success: true,
            data: flashcardSet.cards[cardIndex],
            message: 'Flashcard reviewed successfully'
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Toggle star/favorite on flashcard
// @route   PUT /api/flashcards/:cardId/star
// @access  Private
export const toggleStarFlashcard = async (req, res, next) => {
    try {
        const flashcardSet = await Flashcard.findOne({ 'cards._id': req.params.cardId, userId: req.user._id });

        if (!flashcardSet) {
            return res.status(404).json({
                success: false,
                error: 'Flashcard Set or Card not found'
            });
        }

        const cardIndex = flashcardSet.cards.findIndex(card => card._id.toString() === req.params.cardId);

        if (cardIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Flashcard not found'
            });
        }

        // Toggle star status
        flashcardSet.cards[cardIndex].isStarred = !flashcardSet.cards[cardIndex].isStarred;

        await flashcardSet.save();

        res.status(200).json({
            success: true,
            data: flashcardSet.cards[cardIndex],
            message: flashcardSet.cards[cardIndex].isStarred ? 'Flashcard starred' : 'Flashcard unstarred'
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Delete flashcard set
// @route   DELETE /api/flashcards/:id
// @access  Private
export const deleteFlashcardSet = async (req, res, next) => {
    try {
        const flashcardSet = await Flashcard.findOne({ _id: req.params.id, userId: req.user._id });

        if (!flashcardSet) {
            return res.status(404).json({
                success: false,
                error: 'Flashcard set not found'
            });
        }

        await flashcardSet.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Flashcard set deleted successfully'
        });

    } catch (error) {
        next(error);
    }
};