
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