"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMessage = void 0;
const genai_1 = require("@google/genai");
const BotConversation_1 = __importDefault(require("../models/BotConversation"));
const aiTools_service_1 = require("./aiTools.service");
const genAI = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `
You are a smart and friendly business assistant for a retail store management 
system called Crystal Store Keeper. You help store owners and managers get 
quick insights about their business by querying live store data.

Rules:
- Do not use any markdown formatting — no asterisks, no bold, no bullet dashes. Use plain text with line breaks and emojis instead.
- Always use the available tools to fetch real data — never guess or make up numbers
- Keep responses concise and conversational — this is a chat bot, not a report
- Format all currency in Nigerian Naira e.g. ₦65,500
- Use simple formatting: bullet points and line breaks work well in Telegram
- When asked about "today", "this week", or "this month" calculate the correct date range yourself based on today's date: ${new Date().toISOString().slice(0, 10)}
- For "this week" use the last 7 days, for "this month" use the 1st of the current month to today
- If a question is completely unrelated to the store (e.g. personal questions, general knowledge), politely say you can only help with store-related questions
- Never expose raw MongoDB IDs, internal field names, or technical system details
- If data comes back empty, say so clearly e.g. "No sales recorded today yet"
- Always end with a helpful follow-up suggestion when relevant
`;
// ─── TOOL DEFINITIONS (@google/genai format) ──────────────────────────────────
const tools = [
    {
        functionDeclarations: [
            {
                name: "get_dashboard_summary",
                description: "Get today's total sales amount, cash in register, number of pending payments, and number of low stock alerts",
            },
            {
                name: "get_sales_by_period",
                description: "Get total revenue, transaction count, average transaction value, and daily breakdown for a specific date range",
                parameters: {
                    type: genai_1.Type.OBJECT,
                    properties: {
                        from: {
                            type: genai_1.Type.STRING,
                            description: "Start date in ISO format e.g. 2026-03-01",
                        },
                        to: {
                            type: genai_1.Type.STRING,
                            description: "End date in ISO format e.g. 2026-03-08",
                        },
                    },
                    required: ["from", "to"],
                },
            },
            {
                name: "get_top_selling_products",
                description: "Get the best selling products ranked by quantity sold within a date range",
                parameters: {
                    type: genai_1.Type.OBJECT,
                    properties: {
                        from: {
                            type: genai_1.Type.STRING,
                            description: "Start date in ISO format",
                        },
                        to: { type: genai_1.Type.STRING, description: "End date in ISO format" },
                        limit: {
                            type: genai_1.Type.NUMBER,
                            description: "How many products to return, default is 5",
                        },
                    },
                    required: ["from", "to"],
                },
            },
            {
                name: "get_low_stock_products",
                description: "Get all products that are at or below their reorder level and need restocking soon",
            },
            {
                name: "get_product_stock",
                description: "Check the current stock level of a specific product by its name",
                parameters: {
                    type: genai_1.Type.OBJECT,
                    properties: {
                        productName: {
                            type: genai_1.Type.STRING,
                            description: "The name or partial name of the product to look up",
                        },
                    },
                    required: ["productName"],
                },
            },
            {
                name: "get_recent_transactions",
                description: "Get the most recent sales transactions with their status",
                parameters: {
                    type: genai_1.Type.OBJECT,
                    properties: {
                        limit: {
                            type: genai_1.Type.NUMBER,
                            description: "Number of transactions to return, default is 5",
                        },
                    },
                },
            },
            {
                name: "get_payment_method_breakdown",
                description: "Get how much revenue was collected via cash, POS, and bank transfer for a period, including percentages",
                parameters: {
                    type: genai_1.Type.OBJECT,
                    properties: {
                        from: {
                            type: genai_1.Type.STRING,
                            description: "Start date in ISO format",
                        },
                        to: { type: genai_1.Type.STRING, description: "End date in ISO format" },
                    },
                    required: ["from", "to"],
                },
            },
            {
                name: "get_customer_info",
                description: "Look up a customer by their name or phone number to get their balance, total spent, and account status",
                parameters: {
                    type: genai_1.Type.OBJECT,
                    properties: {
                        query: {
                            type: genai_1.Type.STRING,
                            description: "Customer full name or phone number",
                        },
                    },
                    required: ["query"],
                },
            },
            {
                name: "get_pending_payments",
                description: "Get all sales with unpaid or partial payments and the total outstanding amount owed",
            },
        ],
    },
];
// THE AI MAIN PROCESS MESSAGE FUNCTION (using gemini)
const processMessage = async ({ businessId, chatId, message, }) => {
    try {
        // 1. loaded the conversation history for this business + chat
        let convo = await BotConversation_1.default.findOne({ businessId, chatId });
        if (!convo) {
            convo = await BotConversation_1.default.create({
                businessId,
                chatId,
                messages: [],
            });
        }
        // 2. build history in Gemini Content format
        // keep last 10 messages to avoid token bloat
        const history = convo.messages
            .slice(-10)
            .map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        }));
        // 3. add the new user message to history
        history.push({
            role: "user",
            parts: [{ text: message }],
        });
        // 4. first call to Gemini
        let response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: history,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                tools,
            },
        });
        // 5. an agentic loop — Gemini may call multiple tools before giving final answer
        while (response.functionCalls && response.functionCalls.length > 0) {
            const functionCall = response.functionCalls[0];
            const { name: toolName, args: toolInput } = functionCall;
            // 6. execute the tool (runs the actual DB query)
            const toolResult = await (0, aiTools_service_1.executeTool)(toolName, toolInput || {}, businessId);
            // 7. add assistant's function call to history
            history.push({
                role: "model",
                parts: [{ functionCall }],
            });
            // 8. add tool result to history
            history.push({
                role: "user",
                parts: [
                    {
                        functionResponse: {
                            name: toolName,
                            response: { result: toolResult },
                        },
                    },
                ],
            });
            // 9. call Gemini again with the tool result
            response = await genAI.models.generateContent({
                model: "gemini-2.5-flash",
                contents: history,
                config: {
                    systemInstruction: SYSTEM_PROMPT,
                    tools,
                },
            });
        }
        // 10. extract final text response
        const finalText = response.text ||
            "Sorry, I couldn't process that request. Please try again.";
        // 11. save both messages to conversation history
        await BotConversation_1.default.findOneAndUpdate({ businessId, chatId }, {
            $push: {
                messages: {
                    $each: [
                        { role: "user", content: message, timestamp: new Date() },
                        { role: "assistant", content: finalText, timestamp: new Date() },
                    ],
                },
            },
            lastMessageAt: new Date(),
        }, { upsert: true });
        return finalText;
    }
    catch (error) {
        console.error("AI service error:", error);
        return "Sorry, something went wrong on my end. Please try again.";
    }
};
exports.processMessage = processMessage;
