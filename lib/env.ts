export function env(name: string, fallback = '') {
  return process.env[name] || fallback;
}

export function appUrl() {
  return env('NEXT_PUBLIC_APP_URL', 'http://localhost:3000').replace(/\/$/, '');
}
