// Small TypeScript require hook so the Node 22+ synthetic backend suite can run
// without adding a second runtime tool. TypeScript is already a project dev dependency.
const fs = require("node:fs");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      experimentalDecorators: true,
    },
    fileName: filename,
  });
  module._compile(result.outputText, filename);
};

require("../test/backend-b.synthetic.test.ts");
require("../test/frontend-static.test.cjs");
