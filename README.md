# AI Flight Planner Agent

An intelligent flight planning assistant powered by OpenRouter's API that helps users find the best flight deals based on their preferences.

## Current Features

- Interactive CLI interface for flight planning
- Finds flights based on:
  - Source/destination cities
  - Departure/return dates 
  - Budget constraints
- Intelligent flight selection considering:
  - Lowest prices
  - Number of stops
  - Flight duration
- Multi-platform flight search (currently mocked data from Kiwi and Skyscanner)
- Detailed itineraries with:
  - Flight IDs
  - Airlines
  - Prices
  - Stop information
  - Duration
  - Platform

## Setup

1. Create `.env.local` with:

```
OPENROUTER_API_KEY=your_openrouter_api_key
API_BASE=https://openrouter.ai/api/v1
DATABASE_URL=your_postgres_database_url
OPENAI_API_KEY=your_openai_api_key # Required for generating embeddings
```

2. Install dependencies:

```
npm i
```

3. Run the CLI:

```
tsx lib/agent/flight-planner.ts
```


## Roadmap

### Rewrite the code in python!

### Real Flight Data Integration
- [ ] Implement web scraping for real-time flight data
- [ ] Add APIs for major flight booking platforms:
  - Kiwi
  - Skyscanner  
  - Google Flights
  - Kayak
  - Expedia
- [ ] Add ability for user to choose the platform they want to search on

### User Personalization
- [ ] Database integration to store:
  - Search history
  - Preferred airlines
  - Common routes
  - Price alerts (based on searches that are triggered daily)
  - Travel preferences
- [ ] Optimize search results via using tools such as llms, metadata, cohere reranging api
- [ ] Personalized recommendations based on past searches

### UI/UX Improvements  
- [ ] Modern web interface with:
  - Real-time chat
  - Interactive calendar
  - Price graphs
  - Map visualization
  - Mobile responsiveness
- [ ] Email notifications
- [ ] Booking integration

### Advanced Features
- [ ] Multi-city trip planning
- [ ] Alternative airport suggestions
- [ ] Flexible date search
