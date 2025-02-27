const GITHUB_API_URL = "https://api.github.com/repos/zub165/emergency-finder/contents/data.json";

// Simple login function
function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === 'admin' && password === 'ertime911') {
        document.getElementById('loginContainer').style.display = 'none';
        document.querySelector('.container').style.display = 'block';
        document.querySelector('.navbar').style.display = 'flex';
    } else {
        document.getElementById('errorMessage').style.display = 'block';
    }
}

// Theme toggle function
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? '' : 'dark';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Handle symptom selection
function handleSymptomClick(symptomBubble) {
    const wasActive = symptomBubble.classList.contains('active');
    symptomBubble.classList.toggle('active');
    
    // Reset severity dots
    const severityDots = symptomBubble.querySelectorAll('.severity-dot');
    severityDots.forEach(dot => dot.classList.remove('active'));
}

// Handle severity selection
function handleSeverityClick(event, dot) {
    event.stopPropagation(); // Prevent bubble click event
    const symptomBubble = dot.closest('.symptom-bubble');
    const level = parseInt(dot.getAttribute('data-level'));
    
    // Reset all dots
    const dots = symptomBubble.querySelectorAll('.severity-dot');
    dots.forEach(d => d.classList.remove('active'));
    
    // Fill dots up to selected level
    dots.forEach(d => {
        if (parseInt(d.getAttribute('data-level')) <= level) {
            d.classList.add('active');
        }
    });
    
    // Activate symptom bubble
    symptomBubble.classList.add('active');
}

// Tab navigation function
function showTab(tabId) {
    // Hide all tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('show', 'active');
    });

    // Show the selected tab pane
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add('show', 'active');
    }

    // Update active state in navigation
    document.querySelectorAll('.navbar a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${tabId}`) {
            link.classList.add('active');
        }
    });
}

// Fetch Wait Times from GitHub
async function loadWaitTimes() {
    try {
        const response = await fetch(GITHUB_API_URL, {
            headers: {
                "Authorization": `token ${window.config.GITHUB_TOKEN}`,
                "Accept": "application/vnd.github.v3+json"
            }
        });
        const data = await response.json();
        const content = JSON.parse(atob(data.content));
        
        let tableHTML = `<tr>
            <th>Timestamp</th>
            <th>Name</th>
            <th>DOB</th>
            <th>Symptoms</th>
            <th>Location</th>
            <th>Wait Time</th>
        </tr>`;

        content.forEach(entry => {
            tableHTML += `<tr>
                <td>${entry.timestamp}</td>
                <td>${entry.firstName} ${entry.lastName}</td>
                <td>${entry.dob}</td>
                <td>${entry.symptoms}</td>
                <td>${entry.location}</td>
                <td>${entry.waitTime} mins</td>
            </tr>`;
        });

        document.getElementById("wait-times-table").innerHTML = tableHTML;
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", function() {
    // Set theme from localStorage
    const savedTheme = localStorage.getItem('theme') || '';
    document.body.setAttribute('data-theme', savedTheme);
    
    // Hide main container and navbar initially
    document.querySelector('.container').style.display = 'none';
    document.querySelector('.navbar').style.display = 'none';
    
    // Setup symptom bubbles
    document.querySelectorAll('.symptom-bubble').forEach(bubble => {
        bubble.addEventListener('click', () => handleSymptomClick(bubble));
        
        // Setup severity dots
        bubble.querySelectorAll('.severity-dot').forEach(dot => {
            dot.addEventListener('click', (e) => handleSeverityClick(e, dot));
        });
    });
    
    // Setup tab navigation
    document.querySelectorAll('.navbar a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('href').substring(1);
            showTab(tabId);
        });
    });

    loadWaitTimes();

    function updateTimeToReach() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const timeElement = document.getElementById('time-to-reach');
        if (timeElement) {
            timeElement.textContent = `${hours}:${minutes}`;
        }
    }

    setInterval(updateTimeToReach, 1000);
    updateTimeToReach();

    // Set Google Maps iframe src
    const origin = "9211 Parthenon Pl,seffner,fl,33584";
    const destination = "morton plan hospital";
    const mapIframe = document.getElementById('google-map');
    if (mapIframe) {
        mapIframe.src = `https://www.google.com/maps/embed/v1/directions?key=${window.config.GOOGLE_MAPS_API_KEY}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
    }

    // Show initial tab (registration)
    showTab('registration-tab');
}); 