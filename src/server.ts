import { tools } from './tools/index.js';

export type ToolName = keyof typeof tools;

export async function invokeTool(name: ToolName, input: unknown) {
  return tools[name](input);
}

if (process.env.NODE_ENV !== 'test') {
  console.log('Agent Skill Exchange MCP server loaded. Exposed tools:', Object.keys(tools));
}
