import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import { getProductCatalogPrompt, fetchProductsFromSheet } from '@/lib/chatbot/sheets';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function callGemini(model: string, apiKey: string, payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const url = new URL(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    );

    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
        timeout: 20000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(`API ${res.statusCode}: ${body}`));
            }
          } catch (e) {
            reject(new Error(`Parse error (${res.statusCode}): ${body}`));
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request to ${model} timed out`));
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured.' },
        { status: 500 }
      );
    }

    // Retrieve live products from Google Sheets
    const [catalogPrompt, products] = await Promise.all([
      getProductCatalogPrompt(),
      fetchProductsFromSheet(),
    ]);

    const systemPrompt = `You are Shopco's intelligent, friendly AI customer support and shopping assistant.
You assist customers with exploring products, checking prices, verifying stock status, and answering questions about products available on the Shopco store.

${catalogPrompt}

Key Guidelines:
1. When asked what products or categories are available, list the items clearly with their prices and stock status.
2. If an item is "Out of Stock" (such as the Ergonomic Office Chair), politely inform the customer that it is currently unavailable and suggest alternatives if applicable.
3. Only recommend and discuss products based on the catalog above. If a user asks for an item not in the store, politely let them know Shopco doesn't currently carry it.
4. Keep answers friendly, conversational, concise, and well-formatted with markdown bullet points or bold text where helpful.`;

    // Format messages for Gemini
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Ensure the conversation begins with a user message
    while (contents.length > 0 && contents[0].role !== 'user') {
      contents.shift();
    }

    if (contents.length === 0) {
      return NextResponse.json({ error: 'At least one user message is required.' }, { status: 400 });
    }

    const payload = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      },
    };

    // Candidates in order of priority (tested working free tier models)
    const modelsToTry = [
      'gemini-3.5-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.8-flash',
    ];

    let replyText = '';
    let lastError = '';

    for (const model of modelsToTry) {
      try {
        const responseData = await callGemini(model, apiKey, payload);
        const candidate = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          replyText = candidate;
          break;
        }
      } catch (err: any) {
        lastError = err?.message || String(err);
        console.warn(`[Chatbot] ${model} attempt failed:`, lastError);
      }
    }

    if (!replyText) {
      return NextResponse.json(
        { error: `Gemini service unavailable: ${lastError}` },
        { status: 502 }
      );
    }

    return NextResponse.json({
      reply: replyText,
      products,
    });
  } catch (error: any) {
    console.error('[Chatbot API] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
