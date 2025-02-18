import { handleAIcommunication } from '../lib/agent/flight-planner';

async function testFlightPlanner() {
    try {
        const response = await handleAIcommunication(
            "I want to fly from New York to London on 2025-03-15 to 2025-03-22 with a budget of $800"
        );
        console.log('Response:', response);
    } catch (error) {
        console.error('Error:', error);
    }
}

testFlightPlanner(); 