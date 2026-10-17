import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        include: ['tests/Frontend/**/*.test.js'],
        environmentOptions: {
            jsdom: { url: 'http://localhost' },
        },
        restoreMocks: true,
    },
});
