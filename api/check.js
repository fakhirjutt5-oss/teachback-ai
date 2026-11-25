// TeachBack AI — Vercel serverless function.
// Hides the Gemini API key on the server so students never see it
// and never have to paste a key. The key lives only in Vercel as an
// environment variable called GEMINI_API_KEY (free tier, no card).
// The browser calls POST /api/check with { prompt } and gets back the
// same Gemini response the site already knows how to read.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST.' });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(501).json({
      error: 'Server key not set yet. The site owner still has to add GEMINI_API_KEY in Vercel.',
    });
  }

  const prompt = req.body && typeof req.body.prompt === 'string' ? req.body.prompt : '';
  if (!prompt || prompt.length < 10 || prompt.length > 15000) {
    return res.status(400).json({ error: 'Explanation missing or too long.' });
  }

  try {
    const gemini = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' +
        encodeURIComponent(key),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4 },
        }),
      }
    );
    const data = await gemini.json();
    if (!gemini.ok) {
      return res.status(502).json({ error: (data.error && data.error.message) || 'Gemini error.' });
    }
    return res.status(200).json(data);
  } catch (e) {
    return res.status(502).json({ error: 'Could not reach Gemini: ' + e.message });
  }
}
