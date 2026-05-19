export type Transaction = { id: string; date: string; merchant: string; amount: number; account: string; category: string; status: "cleared" | "pending"; };
export type Budget = { category: string; budgeted: number; actual: number; };
export type ChatMessage = { id: string; role: "user" | "assistant"; content: string; createdAt: string; };
