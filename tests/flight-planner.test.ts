export {};  // Makes this a module

async function runTest() {
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "I want to fly from New York to London on 2025-03-15 to 2025-03-22 with a budget of $800"
      })
    });

    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

runTest(); 