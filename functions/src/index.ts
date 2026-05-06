// InspectFlow Cloud Functions
//
// generateConditionSummary: HTTPS callable-style endpoint that takes an
// inspectionId, loads the inspection from Firestore, calls Claude (with prompt
// caching enabled on the system prompt) and stores the resulting summary back
// on the inspection document. Falls back to a deterministic fixture summary
// when ANTHROPIC_API_KEY is not configured, so the demo never breaks.
//
// generateReportPdf: stub left for production (would render @react-pdf/renderer
// to a buffer and upload to Storage at reports/{inspectionId}/report.pdf).
// The browser already produces a print-ready PDF for the demo.

import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';
import Anthropic from '@anthropic-ai/sdk';

admin.initializeApp();
const db = admin.firestore();

const SYSTEM_PROMPT = `You are a property-inspection report writer for a maintenance ops team.
Your job: read the structured inspection results and write a tight 2-3 sentence
condition summary that a property manager can drop into a tenant report.

Hard rules:
- No fluff, no "I". Direct, declarative. Mention severity. Group related plumbing
  or electrical findings into one sentence rather than enumerating each.
- Always call out life-safety items (smoke / CO / fire / electrical) explicitly.
- If 0 failures, end with a recommendation cadence (e.g. quarterly recheck).
- If failures exist, end with how many tickets to open + a reinspection horizon.
- Never invent issues that aren't in the data.
`;

export const generateConditionSummary = onRequest(
  { cors: true, region: 'us-central1' },
  async (req, res) => {
    try {
      const inspectionId = req.body?.inspectionId || req.query?.inspectionId;
      if (!inspectionId) {
        res.status(400).json({ error: 'inspectionId required' });
        return;
      }

      const snap = await db.collection('inspections').doc(String(inspectionId)).get();
      if (!snap.exists) {
        res.status(404).json({ error: 'inspection not found' });
        return;
      }
      const ins = snap.data() as any;

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        logger.warn('ANTHROPIC_API_KEY not set — returning fixture summary');
        const summary = fixtureSummary(ins);
        await snap.ref.update({ aiSummary: summary, aiSummaryCachedAt: Date.now() });
        res.json({ summary, source: 'fixture' });
        return;
      }

      const anthropic = new Anthropic({ apiKey });
      const userContent = buildUserContent(ins);

      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: userContent }],
      });

      const summary = msg.content
        .filter((b: any) => b.type === 'text')
        .map((b: any) => b.text)
        .join('\n')
        .trim();

      await snap.ref.update({ aiSummary: summary, aiSummaryCachedAt: Date.now() });
      logger.info('AI summary generated', {
        inspectionId,
        cacheRead: (msg.usage as any)?.cache_read_input_tokens ?? 0,
        cacheCreate: (msg.usage as any)?.cache_creation_input_tokens ?? 0,
      });

      res.json({ summary, source: 'anthropic', usage: msg.usage });
    } catch (err: any) {
      logger.error('generateConditionSummary failed', err);
      res.status(500).json({ error: err.message ?? 'internal' });
    }
  }
);

function buildUserContent(ins: any): string {
  const fails = (ins.items || []).filter((i: any) => i.status === 'fail');
  const passes = (ins.items || []).filter((i: any) => i.status === 'pass').length;
  const total = (ins.items || []).length;

  const lines: string[] = [];
  lines.push(`Property: ${ins.propertyName}`);
  lines.push(`Unit: ${ins.unitLabel}`);
  lines.push(`Inspector: ${ins.inspectorName}`);
  lines.push(`Status: ${ins.status}`);
  lines.push(`Result counts: ${passes} pass / ${fails.length} fail / ${total} total`);
  if (ins.generalNotes) lines.push(`Inspector notes: ${ins.generalNotes}`);
  if (fails.length > 0) {
    lines.push('Failed items:');
    for (const f of fails) {
      lines.push(`  - [${f.severity ?? 'medium'}] ${f.category}: ${f.label}${f.notes ? ` — ${f.notes}` : ''}${f.photos?.length ? ` (${f.photos.length} photo${f.photos.length === 1 ? '' : 's'} attached)` : ''}`);
    }
  } else {
    lines.push('No failed items.');
  }
  return lines.join('\n');
}

function fixtureSummary(ins: any): string {
  const fails = (ins.items || []).filter((i: any) => i.status === 'fail');
  const passes = (ins.items || []).filter((i: any) => i.status === 'pass').length;
  const total = (ins.items || []).length;
  if (fails.length === 0) {
    return `${ins.unitLabel} at ${ins.propertyName} passed cleanly: ${passes}/${total} items pass, no failures recorded. Property is in serviceable condition. Recommend routine recheck on next quarterly cycle.`;
  }
  const safety = fails.find((f: any) => /smoke|co|fire|electrical|panel|outlet/i.test(f.label));
  return [
    `${ins.unitLabel} at ${ins.propertyName} is in flagged condition with ${fails.length} of ${total} checklist items failing.`,
    safety ? `Life-safety attention required: ${safety.label.toLowerCase()}.` : '',
    `Open ${fails.length} maintenance ticket${fails.length === 1 ? '' : 's'} and reinspect within 14 days.`,
  ].filter(Boolean).join(' ');
}
