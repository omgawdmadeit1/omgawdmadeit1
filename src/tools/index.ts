import { ExecutionStatus, LicenseRequestStatus, LicenseStatus, SkillStatus, TradeStatus, UserRole } from '@prisma/client';
import { prisma } from '../db.js';
import * as input from '../types.js';
import { getAuthContext, requireRole } from '../auth/context.js';
import { incMetric } from '../observability/metrics.js';
import { logger } from '../observability/logger.js';
import { enqueue } from '../queue/execution-queue.js';

const AUTO_APPROVE = process.env.AUTO_APPROVE_SKILLS === 'true';
const blockedTerms = ['malware', 'exploit'];

async function withRetry<T>(fn: () => Promise<T>, max = 2): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= max; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

export const tools = {
  async search_skills(raw: unknown) {
    const p = input.searchSkillsInput.parse(raw ?? {});
    incMetric('search_skills');
    const skills = await prisma.skill.findMany({
      where: {
        status: SkillStatus.ACTIVE,
        category: p.category,
        skillType: p.skillType,
        executionMode: p.executionMode,
        OR: p.query
          ? [
              { title: { contains: p.query, mode: 'insensitive' } },
              { description: { contains: p.query, mode: 'insensitive' } }
            ]
          : undefined
      },
      take: p.limit,
      include: { seller: true, reviews: true }
    });
    return {
      skills: skills.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        type: s.skillType,
        seller: s.seller.name,
        status: s.status,
        rating: s.reviews.length ? s.reviews.reduce((a, r) => a + r.rating, 0) / s.reviews.length : null
      }))
    };
  },
  async get_skill(raw: unknown) {
    const p = input.getSkillInput.parse(raw);
    incMetric('get_skill');
    return prisma.skill.findUniqueOrThrow({
      where: { id: p.skillId },
      include: { versions: true, reviews: { include: { reviewer: true } }, seller: true }
    });
  },
  async create_agent(raw: unknown) {
    const auth = getAuthContext();
    const p = input.createAgentInput.parse(raw);
    incMetric('create_agent');
    return prisma.agent.create({ data: { ownerId: auth.userId, ...p } });
  },
  async list_my_agents(raw: unknown) {
    const auth = getAuthContext();
    const p = input.listMyAgentsInput.parse(raw);
    return prisma.agent.findMany({ where: { ownerId: p?.ownerId ?? auth.userId } });
  },
  async create_skill(raw: unknown) {
    const auth = getAuthContext();
    requireRole(auth, [UserRole.SELLER, UserRole.ADMIN]);
    const p = input.createSkillInput.parse(raw);
    const flagged = blockedTerms.some((t) => p.title.toLowerCase().includes(t) || p.description.toLowerCase().includes(t));
    const status = AUTO_APPROVE && !flagged ? SkillStatus.ACTIVE : SkillStatus.PENDING_REVIEW;
    const skill = await prisma.skill.create({ data: { sellerId: auth.userId, ...p, status } });
    await prisma.adminAuditLog.create({
      data: {
        actorUserId: auth.userId,
        action: flagged ? 'SKILL_FLAGGED_FOR_REVIEW' : 'SKILL_CREATED',
        entityType: 'Skill',
        entityId: skill.id,
        metadata: { flagged }
      }
    });
    return skill;
  },
  async request_skill_license(raw: unknown) {
    const p = input.requestSkillLicenseInput.parse(raw);
    return prisma.skillLicenseRequest.create({ data: p });
  },
  async approve_license_request(raw: unknown) {
    const auth = getAuthContext();
    requireRole(auth, [UserRole.ADMIN, UserRole.SELLER]);
    const p = input.approveLicenseRequestInput.parse(raw);
    const req = await prisma.skillLicenseRequest.update({
      where: { id: p.licenseRequestId },
      data: { status: LicenseRequestStatus.APPROVED, reviewedAt: new Date() }
    });
    return prisma.skillLicense.upsert({
      where: { agentId_skillId: { agentId: req.agentId, skillId: req.skillId } },
      create: { agentId: req.agentId, skillId: req.skillId, status: LicenseStatus.ACTIVE, grantedById: auth.userId },
      update: { status: LicenseStatus.ACTIVE, grantedById: auth.userId }
    });
  },
  async create_skill_request(raw: unknown) {
    const p = input.createSkillRequestInput.parse(raw);
    return prisma.skillRequest.create({ data: p });
  },
  async make_skill_offer(raw: unknown) {
    const p = input.makeSkillOfferInput.parse(raw);
    return prisma.skillOffer.create({ data: p });
  },
  async propose_skill_trade(raw: unknown) {
    const p = input.proposeSkillTradeInput.parse(raw);
    return prisma.skillTrade.create({ data: p });
  },
  async accept_skill_trade(raw: unknown) {
    const p = input.acceptSkillTradeInput.parse(raw);
    const trade = await prisma.skillTrade.update({ where: { id: p.tradeId }, data: { status: TradeStatus.ACCEPTED } });
    await prisma.skillLicense.upsert({
      where: { agentId_skillId: { agentId: trade.requestingAgentId, skillId: trade.requestedSkillId } },
      create: { agentId: trade.requestingAgentId, skillId: trade.requestedSkillId, status: LicenseStatus.ACTIVE },
      update: { status: LicenseStatus.ACTIVE }
    });
    await prisma.skillLicense.upsert({
      where: { agentId_skillId: { agentId: trade.targetAgentId, skillId: trade.offeredSkillId } },
      create: { agentId: trade.targetAgentId, skillId: trade.offeredSkillId, status: LicenseStatus.ACTIVE },
      update: { status: LicenseStatus.ACTIVE }
    });
    return trade;
  },
  async run_skill(raw: unknown) {
    const p = input.runSkillInput.parse(raw);
    const license = await prisma.skillLicense.findUnique({
      where: { agentId_skillId: { agentId: p.agentId, skillId: p.skillId } }
    });
    if (!license || license.status !== LicenseStatus.ACTIVE) throw new Error('Active license required');
    const execution = await prisma.skillExecution.create({
      data: { agentId: p.agentId, skillId: p.skillId, input: p.input, status: ExecutionStatus.QUEUED, isMock: true }
    });
    enqueue({
      id: execution.id,
      payload: { executionId: execution.id, skillId: p.skillId, input: p.input },
      run: async (payload) => {
        await withRetry(async () => {
          const skill = await prisma.skill.findUniqueOrThrow({ where: { id: payload.skillId } });
          const started = Date.now();
          const output = ['MOCK', 'PROMPT_TEMPLATE'].includes(skill.executionMode)
            ? {
                mock: true,
                note: `Mock execution for ${skill.title}`,
                echoedInput: payload.input,
                result: { summary: 'Synthetic result for development.', confidence: 0.82 }
              }
            : { mock: true, note: 'External execution not implemented yet.', mode: skill.executionMode };
          await prisma.skillExecution.update({
            where: { id: payload.executionId },
            data: { output, status: ExecutionStatus.SUCCEEDED, durationMs: Date.now() - started, finishedAt: new Date() }
          });
        });
      }
    });
    logger.info({ executionId: execution.id }, 'Queued skill execution');
    return { ...execution, message: 'Execution queued; result will be persisted asynchronously.' };
  },
  async get_execution_history(raw: unknown) {
    const p = input.getExecutionHistoryInput.parse(raw);
    return prisma.skillExecution.findMany({
      where: { agentId: p.agentId, skillId: p.skillId },
      take: p.limit,
      orderBy: { createdAt: 'desc' }
    });
  }
};
