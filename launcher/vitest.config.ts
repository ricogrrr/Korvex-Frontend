import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    /* launcher/.env may point the app at the real backend; unit tests always
       exercise the fixture mock. */
    env: { VITE_WS_URL: '' },
  },
});
