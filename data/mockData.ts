import { Budget, Transaction } from "@/lib/types";

export const accounts = [
  { id: "a1", name: "Mercury Checking", balance: 68420, type: "Business Checking" },
  { id: "a2", name: "Amex Gold", balance: -4390, type: "Credit Card" },
  { id: "a3", name: "Stripe Reserve", balance: 19400, type: "Payment Processor" },
];

export const transactions: Transaction[] = [
  { id: "t1", date: "2026-05-15", merchant: "AWS", amount: -820, account: "Amex Gold", category: "Software", status: "cleared" },
  { id: "t2", date: "2026-05-14", merchant: "Client Retainer", amount: 12000, account: "Mercury Checking", category: "Revenue", status: "cleared" },
  { id: "t3", date: "2026-05-13", merchant: "Notion", amount: -96, account: "Amex Gold", category: "Software", status: "cleared" },
  { id: "t4", date: "2026-05-12", merchant: "Google Ads", amount: -1450, account: "Amex Gold", category: "Marketing", status: "pending" },
  { id: "t5", date: "2026-05-10", merchant: "Contractor Payout", amount: -2800, account: "Mercury Checking", category: "Payroll", status: "cleared" }
];

export const budgets: Budget[] = [
  { category: "Marketing", budgeted: 4000, actual: 3250 },
  { category: "Software", budgeted: 1200, actual: 980 },
  { category: "Payroll", budgeted: 12000, actual: 9500 }
];
