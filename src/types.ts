import { z } from 'zod';
import { ExecutionMode, SkillType } from '@prisma/client';

export const jsonSchema = z.record(z.any());
export const searchSkillsInput = z.object({ query: z.string().optional(), category: z.string().optional(), skillType: z.nativeEnum(SkillType).optional(), executionMode: z.nativeEnum(ExecutionMode).optional(), limit: z.number().int().min(1).max(50).default(10) });
export const getSkillInput = z.object({ skillId: z.string().cuid() });
export const createAgentInput = z.object({ name: z.string().min(2), description: z.string().min(3), goals: z.array(z.string()), capabilities: z.array(z.string()) });
export const listMyAgentsInput = z.object({ ownerId: z.string().cuid().optional() }).optional();
export const createSkillInput = z.object({ title: z.string(), description: z.string(), skillType: z.nativeEnum(SkillType), executionMode: z.nativeEnum(ExecutionMode), inputSchema: jsonSchema, outputSchema: jsonSchema, documentation: z.string(), category: z.string().optional() });
export const requestSkillLicenseInput = z.object({ agentId: z.string().cuid(), skillId: z.string().cuid(), reason: z.string().min(3) });
export const approveLicenseRequestInput = z.object({ licenseRequestId: z.string().cuid() });
export const createSkillRequestInput = z.object({ agentId: z.string().cuid().optional(), title: z.string(), description: z.string(), requiredInput: jsonSchema, expectedOutput: jsonSchema, category: z.string().optional() });
export const makeSkillOfferInput = z.object({ requestId: z.string().cuid(), skillId: z.string().cuid().optional(), message: z.string(), proposedExecutionMode: z.nativeEnum(ExecutionMode) });
export const proposeSkillTradeInput = z.object({ requestingAgentId: z.string().cuid(), targetAgentId: z.string().cuid(), offeredSkillId: z.string().cuid(), requestedSkillId: z.string().cuid(), message: z.string() });
export const acceptSkillTradeInput = z.object({ tradeId: z.string().cuid() });
export const runSkillInput = z.object({ agentId: z.string().cuid(), skillId: z.string().cuid(), input: jsonSchema });
export const getExecutionHistoryInput = z.object({ agentId: z.string().cuid(), skillId: z.string().cuid().optional(), limit: z.number().int().min(1).max(100).default(20) });
