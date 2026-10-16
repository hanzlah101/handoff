import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  ...ultracite,
  // Agent skills are vendor files, replaced by `bunx skills update`.
  ignorePatterns: [".agents/**", ".claude/**", "skills-lock.json"],
  sortTailwindcss: {
    functions: ["clsx", "cva", "tw", "twMerge", "cn", "twJoin", "tv"],
    stylesheet: "./src/app/globals.css",
  },
});
