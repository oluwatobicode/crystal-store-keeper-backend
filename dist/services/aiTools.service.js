"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeTool = exports.AI_TOOLS = void 0;
const queries_service_1 = require("./queries.service");
// TOOL DEFINITIONS (what gemini sees)
// This tells gemini what tools exist, what they do, and what params they need
exports.AI_TOOLS = [
    {
        name: "get_dashboard_summary",
        description: "Get today's total sales, cash in register, pending payments count, and low stock alerts count",
        input_schema: {
            type: "object",
            properties: {},
            required: [],
        },
    },
    {
        name: "get_sales_by_period",
        description: "Get total revenue, transaction count, average transaction value, and daily breakdown for a date range",
        input_schema: {
            type: "object",
            properties: {
                from: {
                    type: "string",
                    description: "Start date in ISO format e.g. 2026-03-01",
                },
                to: {
                    type: "string",
                    description: "End date in ISO format e.g. 2026-03-08",
                },
            },
            required: ["from", "to"],
        },
    },
    {
        name: "get_top_selling_products",
        description: "Get the best selling products by quantity sold in a date range",
        input_schema: {
            type: "object",
            properties: {
                from: { type: "string", description: "Start date ISO string" },
                to: { type: "string", description: "End date ISO string" },
                limit: {
                    type: "number",
                    description: "How many products to return, default is 10",
                },
            },
            required: ["from", "to"],
        },
    },
    {
        name: "get_low_stock_products",
        description: "Get all products that are at or below their reorder level and need restocking",
        input_schema: {
            type: "object",
            properties: {},
            required: [],
        },
    },
    {
        name: "get_product_stock",
        description: "Check the current stock level of a specific product by name",
        input_schema: {
            type: "object",
            properties: {
                productName: {
                    type: "string",
                    description: "The name or partial name of the product",
                },
            },
            required: ["productName"],
        },
    },
    {
        name: "get_recent_transactions",
        description: "Get the most recent sales transactions",
        input_schema: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Number of transactions to return, default is 5",
                },
            },
            required: [],
        },
    },
    {
        name: "get_payment_method_breakdown",
        description: "Get how much was collected via cash, POS, and bank transfer in a period, with percentages",
        input_schema: {
            type: "object",
            properties: {
                from: { type: "string", description: "Start date ISO string" },
                to: { type: "string", description: "End date ISO string" },
            },
            required: ["from", "to"],
        },
    },
    {
        name: "get_customer_info",
        description: "Look up a customer by name or phone number — returns their balance, total spent, and status",
        input_schema: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "Customer full name or phone number",
                },
            },
            required: ["query"],
        },
    },
    {
        name: "get_pending_payments",
        description: "Get all sales with unpaid or partial payments and the total amount owed",
        input_schema: {
            type: "object",
            properties: {},
            required: [],
        },
    },
];
//  TOOL EXECUTOR ( switch statement)
// this tells gemini to call a tool → we run the matching query → return result as JSON string
// Must return a string because that's what gemini's tool_result expects
const executeTool = async (toolName, toolInput, businessId) => {
    try {
        switch (toolName) {
            case "get_dashboard_summary": {
                const data = await (0, queries_service_1.getDashboardSummary)(businessId);
                return JSON.stringify(data);
            }
            case "get_sales_by_period": {
                const { from, to } = toolInput;
                const data = await (0, queries_service_1.getSalesByPeriod)(businessId, from, to);
                return JSON.stringify(data);
            }
            case "get_top_selling_products": {
                const { from, to, limit = 5 } = toolInput;
                const data = await (0, queries_service_1.getTopSellingProducts)(businessId, from, to, limit);
                return JSON.stringify(data);
            }
            case "get_low_stock_products": {
                const data = await (0, queries_service_1.getLowStockProducts)(businessId);
                return JSON.stringify(data);
            }
            case "get_product_stock": {
                const { productName } = toolInput;
                const data = await (0, queries_service_1.getProductStock)(businessId, productName);
                if (!data) {
                    return JSON.stringify({
                        error: `Product "${productName}" not found`,
                    });
                }
                return JSON.stringify(data);
            }
            case "get_recent_transactions": {
                const { limit = 5 } = toolInput;
                const data = await (0, queries_service_1.getRecentTransactions)(businessId, limit);
                return JSON.stringify(data);
            }
            case "get_payment_method_breakdown": {
                const { from, to } = toolInput;
                const data = await (0, queries_service_1.getPaymentMethodBreakdown)(businessId, from, to);
                return JSON.stringify(data);
            }
            case "get_customer_info": {
                const { query } = toolInput;
                const data = await (0, queries_service_1.getCustomerInfo)(businessId, query);
                if (!data) {
                    return JSON.stringify({ error: `Customer "${query}" not found` });
                }
                return JSON.stringify(data);
            }
            case "get_pending_payments": {
                const data = await (0, queries_service_1.getPendingPayments)(businessId);
                return JSON.stringify(data);
            }
            default:
                return JSON.stringify({ error: `Unknown tool: ${toolName}` });
        }
    }
    catch (error) {
        // if a query fails, tell Claude so it can respond gracefully
        console.error(`Tool execution error [${toolName}]:`, error);
        return JSON.stringify({ error: "Failed to fetch data. Please try again" });
    }
};
exports.executeTool = executeTool;
