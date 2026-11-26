import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "noyau",
          include: ["noyau/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "synchro",
          include: ["app/src/synchro/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "backend",
          include: ["tests/backend/**/*.test.ts"],
          testTimeout: 30_000,
          fileParallelism: false,
        },
      },
    ],
  },
});
