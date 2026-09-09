import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as React from "react";
import * as jsx from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";

const code = ts.transpileModule(fs.readFileSync("src/components/reports/ReportActions.tsx", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX }
}).outputText;
const module = { exports: {} };
vm.runInNewContext(code, {
  module, exports: module.exports,
  require(id) {
    if (id === "react") return React;
    if (id === "react/jsx-runtime") return jsx;
    if (id.endsWith(".css")) return { default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (id.includes("heroicons")) return new Proxy({}, { get: () => () => null });
    if (id.endsWith("/Button")) return { Button: ({ children }) => jsx.jsx("button", { children }) };
    throw new Error(`Unexpected dependency: ${id}`);
  }
});

test("report preview and print preserve the same literal report, with no active markup", () => {
  const reportText = "Estimare: 271.500 RON\nConfirmat: 18.500 RON\n<script>unsafe()</script>";
  const html = renderToStaticMarkup(jsx.jsx(module.exports.ReportActions, { reportText }));
  assert.equal((html.match(/Estimare: 271\.500 RON/g) ?? []).length, 2);
  assert.equal((html.match(/Confirmat: 18\.500 RON/g) ?? []).length, 2);
  assert.equal((html.match(/&lt;script&gt;unsafe\(\)&lt;\/script&gt;/g) ?? []).length, 2);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /class="printCopy"/);
  assert.match(html, /Copiază raportul/);
  assert.match(html, /Descarcă \.txt/);
  assert.match(html, /Tipărește \/ PDF/);
});
