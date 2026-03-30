import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function chatKuss(req, res) {
  try {
    const { messages, system } = req.body;
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system,
      messages,
    });
    res.json({ content: response.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}