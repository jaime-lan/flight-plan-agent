import { ChatCompletionTool } from "../../node_modules/openai/resources";

export const mainTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "planFlight",
      description: "Find the cheapest flight based on source city, destination city, departure date, return date, and budget",
      parameters: {
        type: "object",
        properties: {
          source_city: { type: "string", description: "City, Country (Example: London, UK)" },
          destination_city: { type: "string", description: "City, Country (Example: London, UK)" },
          departure_date: { type: "string", description: "Departure date in format YYYY-MM-DD" },
          return_date: { type: "string", description: "Return date in format YYYY-MM-DD" },
          budget: { type: "number", description: "Trip budget in USD" }
        },
        required: ["source_city", "destination_city", "departure_date", "return_date", "budget"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "saveMemory",
      description: "Use this tool to save any user-related information to the database that can be used for future reference. Always use it when the user provides new information about themselves. Check if you have already saved the information about the user before saving it to the database. If there are conflicts, with existing information, ask user to clarify what they want you to remember.",
      parameters: {
        type: "object",
        properties: {
          memory: {type: "string", description: "User-related information to save to the database"}
        },
        required: ["memory"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getMemory",
      description: "Use this tool to retrieve user-related information from the database, whenever the user implies that you know something about them. If you don't know relevant information, politely ask the user to provide you with the information that you need and that you can save to the database for later using the saveMemory tool.",
      parameters: {
        type: "object",
        properties: {
          query: {type: "string", description: "The query to retrieve user-related information from the database"}
        },
        required: ["query"]
      }
    }
  }
];

export const planTripTools: ChatCompletionTool[] = [
    {
        type: "function",
        function: {
          name: "getFlights",
          description: "Find available flights based on the source city, destination city, departure date and return date.",
          parameters: {
            type: "object",
            properties: {
              source_city: { type: "string" },
              destination_city: { type: "string" },
              departure_date: { type: "string" },
              return_date: { type: "string" },
            },
            required: ["source_city", "destination_city", "departure_date", "return_date"]
          },
        },
    },
    {
        type: "function",
        function: {
          name: "checkBudget",
          description: "Check if flight price is within user's budget",
          parameters: {
            type: "object",
            properties: {
              price: { type: "number" },
              budget: { type: "number" }
            },
            required: ["price", "budget"]
          }
        }
    },
    {
        type: "function",
        function: {
          name: "isFlightPlanned",
          description: "Check if the flight is fully planned (including being within budget). Include a simple financial breakdown of the flight at the end of the final itinerary.",
          parameters: {
            type: "object",
            properties: {
              isPlanned: { type: "boolean", description: "Whether the flight is fully planned" },
              finalItinerary: { type: "string", description: "The final itinerary of the flight" }
            },
            required: ["isPlanned", "finalItinerary"]
          }
        }
    }
];