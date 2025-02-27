const { EmergencyFinderTestSuite } = require('../js/main.js');

async function runTests() {
    console.log('🏥 Starting Emergency Finder Tests...\n');
    
    const testSuite = new EmergencyFinderTestSuite();
    
    try {
        // Run all test categories
        await testSuite.testRegistrationForm();
        await testSuite.testWaitTimeCalculations();
        await testSuite.testSeverityScale();
        await testSuite.testMapFunctionality();
        
        console.log('\n✅ All tests completed successfully!');
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    }
}

runTests(); 