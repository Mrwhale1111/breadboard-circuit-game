/**
 * Vercel serverless function for the "Ask Watt" chat widget (src/chat/CircuitChat.jsx).
 *
 * Local dev serves the same feature through server.js / the Vite middleware in
 * vite.config.js, both of which speak raw Node http and call handleDevinChat
 * directly. Vercel's Node runtime pre-parses the JSON body onto `req.body` and
 * hands back `res.status().json()` helpers, so this wraps askDevin with that
 * instead of reusing handleDevinChat's raw-stream reading.
 */
import { askDevin } from '../devin-chat-server.js';

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const question = req.body?.question?.trim();
    if (!question || question.length > 500) {
      res.status(400).json({ error: 'Enter a question of 500 characters or fewer.' });
      return;
    }
    const answer = await askDevin(question);
    res.status(200).json({ answer });
  } catch (error) {
    res.status(error.statusCode || 502).json({ error: error.message || 'Unable to contact Devin.' });
  }
}
