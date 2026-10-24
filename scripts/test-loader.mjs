// Lets `node --test` load the app's TypeScript as-is (Node 24 strips types): resolves "@/..." like
// tsconfig, adds the missing .ts extension, and imports .json files. Used by `npm test`.
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";

const root = pathToFileURL(`${process.cwd()}/`).href;

registerHooks({
  resolve(specifier, context, nextResolve) {
    const spec = specifier.startsWith("@/") ? root + specifier.slice(2) : specifier;
    try {
      return nextResolve(spec, context);
    } catch (error) {
      if (!/^(\.|file:)/.test(spec)) throw error;
      for (const ext of [".ts", "/index.ts"]) {
        try {
          return nextResolve(spec + ext, context);
        } catch {
          // try the next extension
        }
      }
      throw error;
    }
  },
  load(url, context, nextLoad) {
    return nextLoad(url, url.endsWith(".json") ? { ...context, importAttributes: { type: "json" } } : context);
  },
});
