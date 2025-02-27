// Rule-based and hybrid chatbot for ER assistance
class ERChatbot {
    constructor(config) {
        const {
            typingIndicatorId = 'typingIndicator',
            chatMessagesId = 'chatMessages',
            userInputId = 'userInput',
            isMainChat = false
        } = config;

        // Initialize DOM elements with error handling
        this.typingIndicator = document.querySelector(`#${typingIndicatorId}`) || this.createTypingIndicator(typingIndicatorId);
        this.chatMessages = document.querySelector(`#${chatMessagesId}`) || this.createChatMessages(chatMessagesId);
        this.userInput = document.querySelector(`#${userInputId}`) || this.createUserInput(userInputId);
        this.messageHistory = [];
        this.isMainChat = isMainChat;
        this.context = {
            lastTopic: null,
            symptomsDiscussed: new Set(),
            severityLevel: 0,
            needsHistory: false
        };
        
        // Initialize tab-specific storage
        this.tabData = {
            registration: {
                personalInfo: {},
                medicalHistory: {},
                medications: {},
                socialHistory: {},
                familyHistory: {},
                insuranceInfo: {}
            },
            records: {
                visits: [],
                prescriptions: [],
                labResults: [],
                imaging: []
            },
            chat: {
                conversations: [],
                pendingQuestions: [],
                doctorResponses: []
            },
            hospital: {
                waitTimes: {},
                departments: {},
                doctors: {}
            }
        };

        // Define common medical questions and responses
        this.responses = {
            'chest pain': 'If you\'re experiencing chest pain, this could be serious. Please call emergency services (911) immediately. Chest pain could indicate a heart attack or other serious conditions.',
            'headache': 'For headaches, check if you have any other symptoms. If you have severe headache with confusion, difficulty speaking, or sudden onset, seek immediate medical attention. For mild headaches, rest in a quiet dark room and stay hydrated.',
            'fever': 'If your fever is above 103°F (39.4°C) or lasts more than 3 days, you should seek medical attention. Stay hydrated and rest. For high fevers, you may use over-the-counter fever reducers.',
            'wait time': 'Current estimated wait time is 25 minutes. This may vary based on emergency cases.',
            'location': 'We are located at 123 Medical Drive. You can find directions in the Directions tab.',
            'emergency': 'If you are experiencing a medical emergency, please call 911 immediately.',
            'insurance': 'We accept most major insurance plans. Please bring your insurance card when you visit.',
            'covid': 'If you have COVID-19 symptoms, please inform the staff before entering. Wear a mask and maintain distance from others.',
            'help': 'I can help you with: \n- Checking wait times\n- Finding directions\n- Basic medical advice\n- Insurance information\n- Emergency guidance\n- Symptom assessment\n- Registration assistance'
        };

        // Advanced symptom patterns for hybrid approach
        this.symptomPatterns = {
            respiratory: ['breathing', 'shortness of breath', 'cough', 'wheezing'],
            cardiac: ['chest pain', 'heart', 'palpitations', 'irregular heartbeat'],
            neurological: ['headache', 'dizziness', 'confusion', 'numbness'],
            gastrointestinal: ['stomach pain', 'nausea', 'vomiting', 'diarrhea'],
            musculoskeletal: ['joint pain', 'muscle pain', 'back pain', 'injury']
        };

        // Add medical history questionnaire structure
        this.historyQuestionnaire = {
            personalInfo: [
                { id: 'name', question: 'What is your full name?', required: true },
                { id: 'dob', question: 'What is your date of birth?', required: true },
                { id: 'phone', question: 'What is your phone number?', required: true }
            ],
            chiefComplaint: [
                { id: 'mainSymptom', question: 'What is your main symptom or concern today?', required: true },
                { id: 'duration', question: 'How long have you had this symptom?', required: true },
                { id: 'severity', question: 'On a scale of 1-10, how severe is your symptom?', required: true }
            ],
            medicalHistory: [
                { id: 'pmh', question: 'Do you have any chronic medical conditions?', required: true },
                { id: 'psh', question: 'Have you had any previous surgeries?', required: true }
            ],
            medications: [
                { id: 'currentMeds', question: 'Are you currently taking any medications? (Please answer Yes or No)', required: true },
                { id: 'prescriptionMeds', question: 'Please list all prescription medications with their dosages and frequency (e.g., Lisinopril 10mg daily)', required: true },
                { id: 'otcMeds', question: 'List any over-the-counter medications you take regularly (e.g., aspirin, vitamins)', required: true },
                { id: 'recentMeds', question: 'Have you taken any medications in the last 24 hours? If yes, please specify', required: true },
                { id: 'herbals', question: 'Do you take any herbal supplements or alternative medicines?', required: true },
                { id: 'allergies', question: 'Do you have any allergies to medications? If yes, please list them and the reactions', required: true },
                { id: 'pharmacyInfo', question: 'What is your preferred pharmacy name and location?', required: true }
            ],
            socialHistory: [
                { id: 'smoking', question: 'Do you smoke or use tobacco products?', required: true },
                { id: 'alcohol', question: 'Do you drink alcohol?', required: true },
                { id: 'occupation', question: 'What is your occupation?', required: true }
            ],
            familyHistory: [
                { id: 'familyHistory', question: 'Any significant diseases in your family?', required: true }
            ],
            review: [
                { id: 'review', question: 'Would you like to review your medical history?', required: false }
            ]
        };

        this.currentHistory = {
            inProgress: false,
            currentSection: null,
            currentQuestionIndex: 0,
            answers: {},
            completed: false
        };

        // Only initialize container for floating chat
        if (!this.isMainChat) {
            this.initializeChatContainer();
        }
    }

    // Create missing elements if needed
    createTypingIndicator(id) {
        const indicator = document.createElement('div');
        indicator.id = id;
        indicator.className = 'typing-indicator';
        indicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        return indicator;
    }

    createChatMessages(id) {
        const messages = document.createElement('div');
        messages.id = id;
        messages.className = 'chat-messages';
        return messages;
    }

    createUserInput(id) {
        const inputContainer = document.createElement('div');
        inputContainer.className = 'chat-input';
        
        const input = document.createElement('input');
        input.id = id;
        input.type = 'text';
        input.placeholder = 'Type your message...';
        
        const button = document.createElement('button');
        button.innerHTML = '<i class="fas fa-paper-plane"></i>';
        button.onclick = () => this.handleUserMessage(input.value);
        
        inputContainer.appendChild(input);
        inputContainer.appendChild(button);
        
        return input;
    }

    getChatContainer() {
        let container = document.querySelector('#chatbot');
        if (!container) {
            container = document.createElement('div');
            container.id = 'chatbot';
            container.className = 'chatbot-container';
            document.body.appendChild(container);
        }
        return container;
    }

    initializeChatContainer() {
        const container = this.getChatContainer();
        container.style.display = 'flex';
        container.classList.add('active');
        
        // Ensure chat button exists
        if (!document.querySelector('.chatbot-button')) {
            const button = document.createElement('button');
            button.className = 'chatbot-button';
            button.innerHTML = '<i class="fas fa-comment-medical"></i>';
            button.onclick = () => this.toggleChat();
            document.body.appendChild(button);
        }
    }

    toggleChat() {
        const container = this.getChatContainer();
        container.classList.toggle('active');
    }

    // Initialize the chatbot
    init() {
        if (this.isMainChat) {
            this.addMessage('bot', 'Hello! Before we proceed, I need to collect your medical history and current medications to better assist you. ' +
                'This information will help us provide you with the best care possible.\n\n' +
                'Would you like to start providing your medical history now? (Please answer Yes to begin)');
            this.context.needsHistory = true;
        } else {
            this.addMessage('bot', 'Hello! I\'m your ER Assistant. How can I help you today? Type "help" to see what I can do.');
        }
        
        // Add event listener for Enter key
        this.userInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                this.handleUserMessage(this.userInput.value);
            }
        });
    }

    // Add a message to the chat
    addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.textContent = text;
        this.chatMessages.insertBefore(messageDiv, this.typingIndicator);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        this.messageHistory.push({ role: sender, content: text });
    }

    // Show typing indicator
    showTyping() {
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'flex';
        }
    }

    // Hide typing indicator
    hideTyping() {
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'none';
        }
    }

    // Find best matching response
    findResponse(userMessage) {
        userMessage = userMessage.toLowerCase();
        
        // Check for exact matches first
        for (let key in this.responses) {
            if (userMessage.includes(key)) {
                return this.responses[key];
            }
        }

        // Check for emergency keywords
        const emergencyKeywords = ['emergency', 'severe', 'intense pain', 'unconscious', 'bleeding heavily'];
        for (let keyword of emergencyKeywords) {
            if (userMessage.includes(keyword)) {
                return 'This sounds serious. Please call emergency services (911) immediately or go to the nearest emergency room.';
            }
        }

        // Default response if no match found
        return 'I\'m not sure how to help with that specific question. For medical emergencies, please call 911. For general inquiries, you can ask about wait times, directions, or type "help" to see what I can assist with.';
    }

    // Enhanced response generation for hybrid approach
    generateHybridResponse(userMessage, context) {
        const message = userMessage.toLowerCase();

        // If history is needed and not completed
        if (this.context.needsHistory && !this.currentHistory.completed) {
            // If user agrees to start history
            if (message.includes('yes') && !this.currentHistory.inProgress) {
                return this.startHistoryTaking();
            }
            // If history taking is in progress
            if (this.currentHistory.inProgress) {
                return this.handleHistoryTaking(message);
            }
            // If user hasn't agreed to start history
            return "I understand you may have questions, but it's important to collect your medical history first. " +
                   "This will help us provide you with more accurate assistance. Would you like to start now? (Please answer Yes)";
        }

        // Regular response handling after history is completed
        if (this.currentHistory.inProgress) {
            return this.handleHistoryTaking(message);
        }

        // Check for emergency keywords first (always handle emergencies regardless of history)
        if (this.isEmergency(message)) {
            return 'This sounds like an emergency. Please call 911 immediately or go to the nearest emergency room.';
        }

        // Handle other queries
        let response = '';

        // Check for basic rule-based responses
        const basicResponse = this.findBasicResponse(message);
        if (basicResponse) return basicResponse;

        // Check for symptom patterns
        const symptoms = this.identifySymptoms(message);
        if (symptoms.length > 0) {
            context.symptomsDiscussed.add(...symptoms);
            response = this.generateSymptomResponse(symptoms, context);
            return response;
        }

        // Generate contextual response based on conversation history
        return this.generateContextualResponse(message, context);
    }

    isEmergency(message) {
        const emergencyKeywords = [
            'emergency', 'severe', 'intense pain', 'unconscious', 'bleeding heavily',
            'stroke', 'heart attack', 'can\'t breathe', 'suicide', 'overdose'
        ];
        return emergencyKeywords.some(keyword => message.includes(keyword));
    }

    findBasicResponse(message) {
        for (let key in this.responses) {
            if (message.includes(key)) {
                return this.responses[key];
            }
        }
        return null;
    }

    identifySymptoms(message) {
        const symptoms = [];
        for (let category in this.symptomPatterns) {
            const categorySymptoms = this.symptomPatterns[category];
            for (let symptom of categorySymptoms) {
                if (message.includes(symptom)) {
                    symptoms.push({ category, symptom });
                }
            }
        }
        return symptoms;
    }

    generateSymptomResponse(symptoms, context) {
        if (symptoms.length === 0) return null;

        const responses = [];
        const uniqueCategories = new Set(symptoms.map(s => s.category));

        for (let category of uniqueCategories) {
            const categorySymptoms = symptoms.filter(s => s.category === category);
            
            switch (category) {
                case 'respiratory':
                    responses.push('For respiratory symptoms, it\'s important to monitor your breathing. If you\'re having severe difficulty breathing, seek immediate medical attention.');
                    break;
                case 'cardiac':
                    responses.push('Cardiac symptoms should be taken seriously. If you\'re experiencing chest pain or irregular heartbeat, please call 911.');
                    break;
                case 'neurological':
                    responses.push('Neurological symptoms can be concerning. If you have sudden onset of severe symptoms or confusion, seek immediate medical care.');
                    break;
                case 'gastrointestinal':
                    responses.push('For gastrointestinal issues, stay hydrated and monitor for severe pain or persistent symptoms.');
                    break;
                case 'musculoskeletal':
                    responses.push('For muscle or joint pain, rest the affected area and apply ice/heat as appropriate.');
                    break;
            }
        }

        // Add wait time information if multiple symptoms are severe
        if (symptoms.length > 1) {
            responses.push('\nCurrent ER wait time is approximately 25 minutes, but severe cases are prioritized.');
        }

        return responses.join('\n\n');
    }

    generateContextualResponse(message, context) {
        // Check for registration-related queries
        if (message.includes('register') || message.includes('sign up') || message.includes('form')) {
            return 'You can register using our online form in the Registration tab. Would you like me to guide you through the registration process?';
        }

        // Check for direction-related queries
        if (message.includes('direction') || message.includes('address') || message.includes('find') || message.includes('map')) {
            return 'You can find directions to our facility in the Directions tab. Would you like me to help you get directions?';
        }

        // Check for wait time queries with context
        if (message.includes('wait') || message.includes('how long')) {
            const baseResponse = 'Current estimated wait time is 25 minutes. ';
            if (context.symptomsDiscussed.size > 0) {
                return baseResponse + 'However, patients are seen based on the severity of their condition, not arrival time.';
            }
            return baseResponse;
        }

        // Default response with context awareness
        return 'I understand you\'re asking about ' + message + '. For specific medical advice, please consult with our medical staff. Is there anything specific about wait times, directions, or registration that I can help you with?';
    }

    startHistoryTaking() {
        this.currentHistory = {
            inProgress: true,
            currentSection: 'personalInfo',
            currentQuestionIndex: 0,
            answers: {},
            completed: false
        };

        return "Thank you for agreeing to provide your medical history. This will help us serve you better.\n\n" +
               "First, " + this.historyQuestionnaire.personalInfo[0].question;
    }

    handleHistoryTaking(message) {
        // Store the answer
        const currentSection = this.currentHistory.currentSection;
        const currentIndex = this.currentHistory.currentQuestionIndex;
        const currentQuestion = this.historyQuestionnaire[currentSection][currentIndex];

        // Save the answer
        if (!this.currentHistory.answers[currentSection]) {
            this.currentHistory.answers[currentSection] = {};
        }
        this.currentHistory.answers[currentSection][currentQuestion.id] = message;

        // Move to next question
        let nextQuestion = this.getNextHistoryQuestion();
        if (nextQuestion) {
            return nextQuestion;
        } else {
            // History taking completed
            this.currentHistory.completed = true;
            this.currentHistory.inProgress = false;
            return this.generateHistorySummary();
        }
    }

    getNextHistoryQuestion() {
        const section = this.currentHistory.currentSection;
        const index = this.currentHistory.currentQuestionIndex + 1;

        if (index < this.historyQuestionnaire[section].length) {
            // Next question in current section
            this.currentHistory.currentQuestionIndex = index;
            return this.historyQuestionnaire[section][index].question;
        }

        // Move to next section
        const sections = Object.keys(this.historyQuestionnaire);
        const currentSectionIndex = sections.indexOf(section);
        
        if (currentSectionIndex < sections.length - 1) {
            const nextSection = sections[currentSectionIndex + 1];
            this.currentHistory.currentSection = nextSection;
            this.currentHistory.currentQuestionIndex = 0;
            
            // Add transition text based on section
            const transitions = {
                chiefComplaint: "\nNow, let's discuss your current symptoms.",
                medicalHistory: "\nLet's go through your medical history.",
                socialHistory: "\nNow for some questions about your lifestyle.",
                familyHistory: "\nLet's discuss your family medical history.",
                review: "\nWe're almost done."
            };
            
            return (transitions[nextSection] || '') + '\n\n' + 
                   this.historyQuestionnaire[nextSection][0].question;
        }

        return null;
    }

    generateHistorySummary() {
        const summary = [
            "Thank you for providing your medical history. Here's a summary for the doctor:",
            "\nPersonal Information:",
            `Name: ${this.currentHistory.answers.personalInfo.name}`,
            `DOB: ${this.currentHistory.answers.personalInfo.dob}`,
            `Phone: ${this.currentHistory.answers.personalInfo.phone}`,
            
            "\nChief Complaint:",
            `Main Symptom: ${this.currentHistory.answers.chiefComplaint.mainSymptom}`,
            `Duration: ${this.currentHistory.answers.chiefComplaint.duration}`,
            `Severity: ${this.currentHistory.answers.chiefComplaint.severity}/10`,
            
            "\nMedical History:",
            `Conditions: ${this.currentHistory.answers.medicalHistory.pmh}`,
            `Surgeries: ${this.currentHistory.answers.medicalHistory.psh}`,
            
            "\nMedications:",
            `Currently Taking Medications: ${this.currentHistory.answers.medications.currentMeds}`,
            `Prescription Medications: ${this.currentHistory.answers.medications.prescriptionMeds}`,
            `Over-the-Counter Medications: ${this.currentHistory.answers.medications.otcMeds}`,
            `Recent Medications (24h): ${this.currentHistory.answers.medications.recentMeds}`,
            `Herbal/Alternative Medicines: ${this.currentHistory.answers.medications.herbals}`,
            `Medication Allergies: ${this.currentHistory.answers.medications.allergies}`,
            `Preferred Pharmacy: ${this.currentHistory.answers.medications.pharmacyInfo}`,
            
            "\nSocial History:",
            `Smoking: ${this.currentHistory.answers.socialHistory.smoking}`,
            `Alcohol: ${this.currentHistory.answers.socialHistory.alcohol}`,
            `Occupation: ${this.currentHistory.answers.socialHistory.occupation}`,
            
            "\nFamily History:",
            `${this.currentHistory.answers.familyHistory.familyHistory}`
        ].join('\n');

        // Store data in appropriate tabs
        this.saveToTab('registration', 'personalInfo', this.currentHistory.answers.personalInfo);
        this.saveToTab('registration', 'medicalHistory', this.currentHistory.answers.medicalHistory);
        this.saveToTab('registration', 'medications', this.currentHistory.answers.medications);
        this.saveToTab('registration', 'socialHistory', this.currentHistory.answers.socialHistory);
        this.saveToTab('registration', 'familyHistory', this.currentHistory.answers.familyHistory);

        // Store in records tab as a new visit
        const visit = {
            date: new Date().toISOString(),
            type: 'Initial Assessment',
            chiefComplaint: this.currentHistory.answers.chiefComplaint,
            status: 'Pending Review'
        };
        this.tabData.records.visits.push(visit);
        this.persistTabData('records');

        // Store the context for medical staff
        this.context.medicalHistory = this.currentHistory.answers;
        this.context.needsHistory = false;
        
        return summary;
    }

    // Add methods to manage tab data
    async saveToTab(tabName, section, data) {
        if (this.tabData[tabName] && this.tabData[tabName][section]) {
            // Update local state
            this.tabData[tabName][section] = {
                ...this.tabData[tabName][section],
                ...data,
                timestamp: new Date().toISOString()
            };
            
            // Persist to localStorage as temporary backup
            this.persistTabData(tabName);
            
            // Send to secure server
            try {
                const response = await fetch('/api/patient-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getAuthToken()}`
                    },
                    body: JSON.stringify({
                        tabName,
                        section,
                        data: this.tabData[tabName][section],
                        patientId: this.getPatientId()
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to save data to server');
                }
                
                return true;
            } catch (error) {
                console.error('Error saving to server:', error);
                // Keep local copy if server save fails
                return false;
            }
        }
        return false;
    }

    async getFromTab(tabName, section) {
        try {
            // Try to get from server first
            const response = await fetch(`/api/patient-data/${tabName}/${section}/${this.getPatientId()}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            if (response.ok) {
                const serverData = await response.json();
                // Update local cache
                if (!this.tabData[tabName]) this.tabData[tabName] = {};
                this.tabData[tabName][section] = serverData;
                return serverData;
            }
        } catch (error) {
            console.error('Error fetching from server:', error);
        }
        
        // Fallback to local data if server request fails
        return this.tabData[tabName]?.[section] || null;
    }

    getAuthToken() {
        // Get authentication token from secure storage
        return sessionStorage.getItem('authToken');
    }

    getPatientId() {
        // Get current patient ID from secure storage
        return sessionStorage.getItem('patientId');
    }

    async loadTabData(tabName) {
        try {
            // Try to load from server
            const response = await fetch(`/api/patient-data/${tabName}/${this.getPatientId()}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            if (response.ok) {
                const serverData = await response.json();
                this.tabData[tabName] = serverData;
                // Update localStorage as backup
                this.persistTabData(tabName);
            } else {
                // Fallback to localStorage if server unavailable
                const savedData = localStorage.getItem(`erChatbot_${tabName}`);
                if (savedData) {
                    this.tabData[tabName] = JSON.parse(savedData);
                }
            }
        } catch (error) {
            console.error(`Error loading ${tabName} data:`, error);
            // Fallback to localStorage if server error
            const savedData = localStorage.getItem(`erChatbot_${tabName}`);
            if (savedData) {
                this.tabData[tabName] = JSON.parse(savedData);
            }
        }
    }

    // Add method to handle doctor responses with server sync
    async storeDoctorResponse(questionId, response) {
        const doctorResponse = {
            questionId,
            response,
            timestamp: new Date().toISOString(),
            doctor: response.doctorName || 'Medical Staff'
        };
        
        // Update local state
        this.tabData.chat.doctorResponses.push(doctorResponse);
        
        // Send to server
        try {
            const serverResponse = await fetch('/api/doctor-responses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    patientId: this.getPatientId(),
                    doctorResponse
                })
            });
            
            if (!serverResponse.ok) {
                throw new Error('Failed to save doctor response to server');
            }
            
            // Update local storage as backup
            this.persistTabData('chat');
        } catch (error) {
            console.error('Error saving doctor response:', error);
            // Keep local copy if server save fails
            this.persistTabData('chat');
        }
    }

    // Add method to update wait times with server sync
    async updateWaitTimes(waitTimeData) {
        // Update local state
        this.tabData.hospital.waitTimes = {
            ...waitTimeData,
            lastUpdated: new Date().toISOString()
        };
        
        // Send to server
        try {
            const response = await fetch('/api/wait-times', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    hospitalId: this.getHospitalId(),
                    waitTimes: this.tabData.hospital.waitTimes
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update wait times on server');
            }
            
            // Update local storage as backup
            this.persistTabData('hospital');
        } catch (error) {
            console.error('Error updating wait times:', error);
            // Keep local copy if server update fails
            this.persistTabData('hospital');
        }
    }

    getHospitalId() {
        // Get current hospital ID from secure storage
        return sessionStorage.getItem('hospitalId');
    }

    // Persist to localStorage as temporary backup only
    persistTabData(tabName) {
        try {
            localStorage.setItem(`erChatbot_${tabName}`, JSON.stringify(this.tabData[tabName]));
        } catch (error) {
            console.error(`Error persisting ${tabName} data to localStorage:`, error);
        }
    }

    // Handle user message with hybrid approach
    async handleUserMessage(message) {
        if (!message.trim()) return;

        // Clear input
        this.userInput.value = '';

        // Add user message to chat
        this.addMessage('user', message);

        // Show typing indicator
        this.showTyping();

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 800));

        let response;
        if (this.isMainChat) {
            // Use hybrid approach for main chat
            response = this.generateHybridResponse(message, this.context);
        } else {
            // Use simple rule-based approach for floating chat
            response = this.findResponse(message);
        }

        // Hide typing indicator
        this.hideTyping();

        // Add bot response to chat
        this.addMessage('bot', response);

        // Update context
        this.updateContext(message, response);
    }

    updateContext(message, response) {
        // Update last topic
        this.context.lastTopic = message;

        // Update severity level based on emergency keywords
        if (this.isEmergency(message)) {
            this.context.severityLevel = 10;
        }

        // Store in message history
        this.messageHistory.push({
            role: 'user',
            content: message,
            timestamp: new Date()
        });
        this.messageHistory.push({
            role: 'bot',
            content: response,
            timestamp: new Date()
        });

        // Add timestamp and structured data if it's a completed medical history
        if (this.currentHistory.completed) {
            this.messageHistory.push({
                type: 'medical_history',
                data: this.currentHistory.answers,
                timestamp: new Date(),
                status: 'pending_review'
            });
        }
    }
}

// Initialize both chatbots
const floatingChatbot = new ERChatbot({
    typingIndicatorId: 'typingIndicator',
    chatMessagesId: 'chatMessages',
    userInputId: 'userInput'
});

const mainChatbot = new ERChatbot({
    typingIndicatorId: 'mainTypingIndicator',
    chatMessagesId: 'mainChatMessages',
    userInputId: 'mainUserInput',
    isMainChat: true
});

// Load saved data for main chatbot
['registration', 'records', 'chat', 'hospital'].forEach(tab => {
    mainChatbot.loadTabData(tab);
});

// Event handlers
window.addEventListener('load', () => {
    floatingChatbot.init();
    mainChatbot.init();
});

window.sendMessage = () => {
    const message = document.getElementById('userInput').value;
    floatingChatbot.handleUserMessage(message);
};

window.sendMainMessage = () => {
    const message = document.getElementById('mainUserInput').value;
    mainChatbot.handleUserMessage(message);
};

window.handleKeyPress = (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
};

window.handleMainKeyPress = (event) => {
    if (event.key === 'Enter') {
        sendMainMessage();
    }
};

window.toggleChat = () => {
    const chatbot = document.getElementById('chatbot');
    chatbot.classList.toggle('active');
}; 