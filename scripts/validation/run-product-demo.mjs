// Start the existing local demo with matching public/server credentials.
// Never seed/reset data or inherit remote service credentials into the local app.
import { runWithLocalEnvironment } from "../demo/local-supabase.mjs";

const mode = process.argv[2] ?? "dev";
if (!["dev", "start"].includes(mode)) throw new Error("Use: node scripts/validation/run-product-demo.mjs dev|start");
runWithLocalEnvironment(process.execPath, ["node_modules/next/dist/bin/next", mode, "--hostname", "localhost", "--port", "3001"]);
