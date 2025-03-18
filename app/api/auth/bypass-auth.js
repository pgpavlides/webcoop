// WARNING: This file is for development only. Remove it in production.

// This route allows you to bypass authentication for development 
// when you get stuck at loading screen

export async function GET(request) {
  return new Response(JSON.stringify({
    message: 'Auth bypass active - for development only',
    steps: [
      '1. Open browser console and run: localStorage.setItem("dev-bypass", "true")',
      '2. Reload the page',
      '3. This bypass only works in development mode'
    ]
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
