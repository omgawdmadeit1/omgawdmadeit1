import express from 'express';
import { tools } from '../tools/index.js';
import { toolRegistry } from '../mcp/registry.js';
import { getMetricsSnapshot } from '../observability/metrics.js';

export function createHttpApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.get('/mcp/tools', (_req, res) => res.json(toolRegistry));
  app.post('/mcp/invoke/:name', async (req, res) => {
    const name = req.params.name as keyof typeof tools;
    if (!tools[name]) return res.status(404).json({ error: 'Tool not found' });
    try {
      const result = await tools[name](req.body ?? {});
      res.json({ result });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  app.get('/metrics', (_req, res) => res.json(getMetricsSnapshot()));
  app.get('/widgets/:name', (req, res) => {
    res.type('html').send(`<!doctype html><html><body><h2>${req.params.name}</h2><div id='widget-root'>Widget route scaffold</div></body></html>`);
  });
  return app;
}
