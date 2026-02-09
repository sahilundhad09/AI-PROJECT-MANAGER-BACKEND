const suggestionsService = require('./suggestions.service');

// Get smart suggestions
const getSuggestions = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { suggestion_type } = req.query;
        const userId = req.user.id;

        const result = await suggestionsService.getSuggestions(projectId, userId, suggestion_type);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSuggestions
};
