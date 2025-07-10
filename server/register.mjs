/**
 * TypeScript Module Registration for Node.js ESM
 * 
 * This file registers ts-node/esm to enable running TypeScript files directly
 * with Node.js without the deprecated --experimental-loader flag.
 * 
 * ALTERNATIVES CONSIDERED:
 * 
 * Option 1: register.mjs file (CHOSEN)
 * ✅ Pros: Explicit, version-controlled, readable package.json scripts
 * ✅ Easy to maintain and understand
 * ✅ Configuration is transparent and documented
 * Usage: node --import ./register.mjs src/index.ts
 * 
 * Option 2: NODE_OPTIONS in .env
 * ❌ Downside: Hides the mechanism, making it less obvious why TypeScript execution works
 * ❌ Environment variables can be forgotten or overlooked
 * ❌ Less explicit about dependencies
 * Usage: NODE_OPTIONS="--import ./register.mjs" node src/index.ts
 * 
 * Option 3: tsconfig.json ts-node configuration updates
 * ❌ Downside: Cannot eliminate Node.js loader requirement
 * ❌ The experimental warning comes from Node.js itself, not ts-node configuration
 * ❌ ts-node ESM must use Node's experimental loader APIs regardless of tsconfig.json
 * ❌ No pure tsconfig.json solution exists for this problem
 * 
 * Option 4: tsx (TypeScript runner)
 * ℹ️  Modern alternative to ts-node with better performance
 * ℹ️  Still requires --import register.mjs for proper ESM setup in complex projects
 * ℹ️  Would still need this file or similar registration mechanism
 * Usage: tsx src/index.ts (but still benefits from explicit registration)
 */

import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Register ts-node/esm to handle .ts file imports
register("ts-node/esm", pathToFileURL("./"));
