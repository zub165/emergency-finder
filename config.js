// Load environment variables
const config = {
    GOOGLE_MAPS_API_KEY: 'AIzaSyCI_RHBNmNwpNpDoUPyZFNPNWUYQmr4QJk',
    OPENAI_API_KEY: 'your-openai-api-key-here', // Add your OpenAI API key here
    GITHUB_TOKEN: process.env.GITHUB_TOKEN
};

// Make config available globally
window.config = config; 