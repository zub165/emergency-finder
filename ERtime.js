require('dotenv').config();

const GITHUB_API_URL = "https://api.github.com/repos/zub165/emergency-finder/contents/data.json";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Fetch Wait Times from GitHub
async function loadWaitTimes() {
    try {
        const response = await fetch(GITHUB_API_URL, {
            headers: {
                "Authorization": `token ${GITHUB_TOKEN}`,
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

// Load wait times on page load
document.addEventListener("DOMContentLoaded", function() {
    loadWaitTimes();

    function updateTimeToReach() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('time-to-reach').textContent = `${hours}:${minutes}`;
    }

    setInterval(updateTimeToReach, 1000);
    updateTimeToReach();

    // Set Google Maps iframe src
    const origin = "9211 Parthenon Pl,seffner,fl,33584";
    const destination = "morton plan hospital";
    const mapIframe = document.getElementById('google-map');
    mapIframe.src = `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_MAPS_API_KEY}&origin=${origin}&destination=${destination}`;
});
