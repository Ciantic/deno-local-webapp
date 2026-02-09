# Local webapp using Deno

This demonstrates how to bundle single webapp in this case SolidJS + TRPC Server + TPRC Client + TailwindCSS + DaisyUI to a single file Deno executable or js file.

Run:

```bash
deno install
deno task build # produces my-app.mjs
deno task preview # Run deno with my-app.js
deno task compile # Create single-file executable from it
```
