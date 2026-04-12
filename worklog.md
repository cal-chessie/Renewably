---
Task ID: 1
Agent: main
Task: Fix "website is unreadable" - diagnose and fix CSS/rendering issues

Work Log:
- Diagnosed website via browser screenshot: all CSS broken (transparent backgrounds, no fonts, animations stuck at opacity:0)
- Found root cause: `tailwind.config.ts` (Tailwind CSS v3 config) conflicting with v4 setup
  - Project uses `@tailwindcss/postcss` v4 plugin but had v3-style config with `tailwindcss-animate` plugin
  - v3 config defined colors as `hsl(var(--x))` while CSS vars used `oklch()` format - incompatible
  - PostCSS v4 plugin was trying to parse v3 config, causing CSS compilation failure
- Removed `tailwind.config.ts` since all theme config exists in `globals.css` via v4 `@theme inline`
- Animations library already handled by `@import "tw-animate-css"` in globals.css
- Verified build passes clean after fix
- Verified lint passes clean after fix
- Dev server was in zombie state (pointing to deleted `.next/standalone` directory)
- Killed zombie process, restarted dev server, confirmed CSS now compiling correctly

Stage Summary:
- Key fix: Removed conflicting `tailwind.config.ts` (v3 config in v4 project)
- Build: passes clean
- Lint: passes clean
- All page routes compile correctly
