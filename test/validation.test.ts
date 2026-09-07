import { describe, expect, it } from 'vitest';
import { createAgentInput, runSkillInput } from '../src/types.js';

describe('zod validation', () => {
  it('validates create agent', () => {
    const parsed = createAgentInput.parse({
      name: 'Lead Agent',
      description: 'Find leads',
      goals: ['find leads'],
      capabilities: ['web research']
    });
    expect(parsed.name).toBe('Lead Agent');
  });

  it('rejects invalid run skill input', () => {
    expect(() => runSkillInput.parse({ agentId: 'bad', skillId: 'bad', input: {} })).toThrow();
  });
});
