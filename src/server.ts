import { tools } from './tools/index.js';
import { createHttpApp } from './http/app.js';

export type ToolName = keyof typeof tools;

export async function invokeTool(name: ToolName, input: unknown) {
  return tools[name](input);
}

if (process.env.NODE_ENV !== 'test') {
  const app = createHttpApp();
  const port = Number(process.env.PORT ?? 3001);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Agent Skill Exchange server running on :${port}`);
    console.log('Exposed tools:', Object.keys(tools));
  });
}
