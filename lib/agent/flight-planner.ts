"use server";
import dotenv from "dotenv";
import OpenAI from "openai";
import { saveMemory, getMemory } from "./memory-ops";
import {
  ChatCompletionMessageParam
} from "../../node_modules/openai/resources"; // for tools and memory
// import * as readline from "readline";
import { flights } from "./mock-data";
import { mainTools, planTripTools } from "./tools";

process.removeAllListeners("warning");
dotenv.config({ path: ".env.local" });
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: process.env.API_BASE,
});


export async function handleAIcommunication(
  userMessage: string,
  previousConversation?: ChatCompletionMessageParam[]
) {
  const systemMessage: ChatCompletionMessageParam = {
    role: "system",
    content:
      "You are a flight planner assistant. Gather the source city, destination city, departure date, return date and budget from the user. Return a list of flights that match the criteria and are within the user's budget. If you do not find any flights or if all flights are over budget, politely notify the user. You also have access to a memory tools that allow you to save and retrieve user-related information from the database. Use those tools **only** when you are missing information or when you have a new imformation about the user. Before asking for any information, check if you have already saved the information about the user in the database. If any information is still missing, ask the user for it.",
  };

  const conversation: ChatCompletionMessageParam[] = previousConversation 
    ? [systemMessage, ...previousConversation] 
    : [systemMessage];
  
  conversation.push({ role: "user", content: userMessage });
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: conversation,
      tools: mainTools,
      tool_choice: "auto",
    });

    const message = response.choices[0].message;

    if (message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);
        console.log(`Calling ${toolCall.function.name} function with args: ${JSON.stringify(args)}`);
        const result = await executeFunction(toolCall.function.name, args);
        conversation.push(
          { role: "assistant", content: message.content, tool_calls: message.tool_calls },
          { role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(result) }
        );
      }
      
      const finalResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: conversation,
        tools: mainTools,
      });
      
      conversation.push({ role: "assistant", content: finalResponse.choices[0].message.content });
      return { 
        content: finalResponse.choices[0].message.content,
        conversation 
      };
    } else {
      conversation.push({ role: "assistant", content: message.content });
      return { 
        content: message.content,
        conversation 
      };
    }
  } catch (error) {
    console.error("Error:", error);
    return { 
      content: "Error processing your request",
      conversation 
    };
  }
}


async function planFlight(sourceCity: string, destination: string, departureDate: string, returnDate: string, budget: number): Promise<string> {
    console.log(`Planning flight from ${sourceCity} to ${destination} with departure date ${departureDate} and return date ${returnDate} with budget $${budget}`);
  
    const planningHistory: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are planning a trip from ${sourceCity} to ${destination} from ${departureDate} to ${returnDate} with a budget of $${budget}. Use the provided tools to search for flights that match the criteria and are within the budget. You need to find the cheapest option. If 2 flights have the same price, return the one with the least stops. **If there are still multiple options, return them all.** In final itinerary, include the flight id, source city, destination city, departure date, return date, airline, price, stops, flight duration and platform for **all** flights matching the criteria.`
      }
    ];
  
    const MAX_ITERATIONS = 10;
    let iterations = 0;
  
    while (iterations < MAX_ITERATIONS) {
      console.log(`Iteration ${iterations + 1}/${MAX_ITERATIONS}`);
  
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: planningHistory,
        tools: planTripTools,
        tool_choice: "auto"
      });

      console.log(`AI Response:`, response.choices[0].message);
  
      const message = response.choices[0].message;
  
      if (message.tool_calls) {
        planningHistory.push({ role: "assistant", content: message.content, tool_calls: message.tool_calls });
  
        for (const toolCall of message.tool_calls) {
          const args = JSON.parse(toolCall.function.arguments);
          console.log(`Calling ${toolCall.function.name} function with args: ${JSON.stringify(args)}`);
          const result = await executeFunction(toolCall.function.name, args);
  
          planningHistory.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result) // important to convert result to string so the llm can read it
          });
          
          if (toolCall.function.name === "isFlightPlanned" && result.isPlanned) {
            return result.finalItinerary;
          }
        }
      } else {
        planningHistory.push(message);
      }
  
      iterations++;
    }
  
    return "Failed to generate a complete trip plan within the maximum number of iterations.";
}


//eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeFunction(name: string, args: any): Promise<any> {
    let result;
    switch (name) {
    case "planFlight":
        result = await planFlight(args.source_city, args.destination_city, args.departure_date, args.return_date, args.budget);
        break;
    case "getFlights":
        result = flights.filter(
            (flight) => flight.source_city.toLowerCase() === args.source_city.toLowerCase() && flight.destination_city.toLowerCase() === args.destination_city.toLowerCase() && flight.departure_date === args.departure_date && flight.return_date === args.return_date
        );
        console.log(result);
        break;
    case "checkBudget":
        result = { 
            withinBudget: args.price <= args.budget,
            remaining: args.budget - args.price
        };
        break;
    case "isFlightPlanned":
        result = {
            isPlanned: args.isPlanned,
            finalItinerary: args.finalItinerary
        };
        break;
    case "saveMemory":
      result = await saveMemory(args.memory);
      break;
    case "getMemory":
      result = await getMemory(args.query);
      console.log(result);
      //result = "Memory saved successfully";
      break;
    default:
        throw new Error(`Unknown function: ${name}`);
    }
  
    return result;
}

// main();