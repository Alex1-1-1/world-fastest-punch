// API呼び出し用の統一ライブラリ
const PUBLIC_API = process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? 'http://localhost:8000';
const SERVER_API = process.env.BACKEND_API_URL ?? PUBLIC_API;

// ブラウザ側（クライアントコンポーネント）用
export const browserApi = (path: string, init: RequestInit = {}) =>
  fetch(`${PUBLIC_API}${path}`, { 
    cache: 'no-store', 
    ...init 
  });

// サーバー側（APIルート）用
export const serverApi = (path: string, init: RequestInit = {}) =>
  fetch(`${SERVER_API}${path}`, { 
    cache: 'no-store', 
    ...init 
  });

// デバッグ用のログ関数
export const logApiError = (context: string, response: Response, body?: string) => {
  console.error(`${context} - Status: ${response.status}, Body: ${body?.slice(0, 500) || 'No body'}`);
};
