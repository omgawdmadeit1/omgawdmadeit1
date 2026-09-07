import { tools } from '../tools/index.js';

export const toolRegistry = Object.entries(tools).map(([name]) => ({ name, description: `Tool ${name}` }));
