import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import https from 'https';

export interface ProductItem {
  name: string;
  category: string;
  price: string;
  stockStatus: string;
  description: string;
}

const FALLBACK_PRODUCTS: ProductItem[] = [
  {
    name: 'Wireless Noise-Canceling Headphones',
    category: 'Electronics',
    price: '$199.99',
    stockStatus: 'In Stock',
    description: 'Over-ear Bluetooth headphones with active noise cancellation.',
  },
  {
    name: 'Ergonomic Office Chair',
    category: 'Furniture',
    price: '$249.50',
    stockStatus: 'Out of Stock',
    description: 'Adjustable mesh chair with lumbar support.',
  },
  {
    name: 'Stainless Steel Water Bottle',
    category: 'Home & Kitchen',
    price: '$24.99',
    stockStatus: 'In Stock',
    description: '32 oz insulated water bottle that keeps drinks cold for 24 hours.',
  },
  {
    name: 'Mechanical Gaming Keyboard',
    category: 'Electronics',
    price: '$89.99',
    stockStatus: 'In Stock',
    description: 'RGB backlit mechanical keyboard with tactile switches.',
  },
  {
    name: 'Organic Cotton T-Shirt',
    category: 'Apparel',
    price: '$19.99',
    stockStatus: 'In Stock',
    description: 'Soft 100% organic cotton crewneck t-shirt.',
  },
];

let cachedProducts: ProductItem[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

function httpsPost(urlStr: string, headers: Record<string, string>, postData: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 10000,
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
              reject(new Error(`HTTP ${res.statusCode}: ${body}`));
            }
          } catch (e) {
            reject(new Error(`JSON Parse Error (${res.statusCode}): ${body}`));
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function httpsGet(urlStr: string, headers: Record<string, string>): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const req = https.request(
      url,
      {
        method: 'GET',
        headers,
        timeout: 10000,
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
              reject(new Error(`HTTP ${res.statusCode}: ${body}`));
            }
          } catch (e) {
            reject(new Error(`JSON Parse Error (${res.statusCode}): ${body}`));
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.on('error', reject);
    req.end();
  });
}

async function getGoogleAccessToken(keyData: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: keyData.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodeBase64Url = (obj: any) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const unsignedToken = `${encodeBase64Url(header)}.${encodeBase64Url(claim)}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsignedToken);
  sign.end();
  const signature = sign
    .sign(keyData.private_key, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${unsignedToken}.${signature}`;

  const postBody = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
  const data = await httpsPost(
    'https://oauth2.googleapis.com/token',
    { 'Content-Type': 'application/x-www-form-urlencoded' },
    postBody
  );

  return data.access_token;
}

export async function fetchProductsFromSheet(): Promise<ProductItem[]> {
  const now = Date.now();
  if (cachedProducts && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedProducts;
  }

  const spreadsheetId = process.env.GOOGLE_SHEET_ID || '1U9S_q3f8nrt_r7Ik6--jtFC1125itIk-g0-tsmpMTus';
  const keyRelPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || './my-ecomerce-store-514219-84a447070c9a.json';
  const keyFullPath = path.resolve(process.cwd(), keyRelPath);

  try {
    if (!fs.existsSync(keyFullPath)) {
      console.warn(`[Chatbot] Key file not found at ${keyFullPath}, using fallback products.`);
      return FALLBACK_PRODUCTS;
    }

    const keyRaw = fs.readFileSync(keyFullPath, 'utf-8');
    const keyData = JSON.parse(keyRaw);

    const token = await getGoogleAccessToken(keyData);
    const sheetData = await httpsGet(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1`,
      { Authorization: `Bearer ${token}` }
    );

    const rows = sheetData.values as string[][] | undefined;

    if (!rows || rows.length < 2) {
      return cachedProducts || FALLBACK_PRODUCTS;
    }

    const products: ProductItem[] = rows.slice(1).map((row) => ({
      name: row[0] || 'Unnamed Product',
      category: row[1] || 'General',
      price: row[2] || '$0.00',
      stockStatus: row[3] || 'In Stock',
      description: row[4] || '',
    }));

    cachedProducts = products;
    lastFetchTime = now;
    return products;
  } catch (error) {
    console.error('[Chatbot] Error reading from Google Sheet:', error);
    return cachedProducts || FALLBACK_PRODUCTS;
  }
}

export async function getProductCatalogPrompt(): Promise<string> {
  const products = await fetchProductsFromSheet();
  const productLines = products
    .map(
      (p, i) =>
        `${i + 1}. **${p.name}**\n   - Category: ${p.category}\n   - Price: ${p.price}\n   - Stock Status: ${p.stockStatus}\n   - Description: ${p.description}`
    )
    .join('\n\n');

  return `Current Live Product Catalog from Store Inventory:\n\n${productLines}`;
}
