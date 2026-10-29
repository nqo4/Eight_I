import { expect, test } from "@playwright/test";
import { SnapshotIndex } from "../../src/server/evidence";
import type { Snapshot } from "../../src/server/types";

test("static dependencies exclude misleading syntax and shadowed require", () => {
  const cases: [string, boolean][] = [
    ["import x from './b'", true],
    ["import './b'", true],
    ["export {x} from './b'", true],
    ["import('./b')", true],
    ["const x = require('./b')", true],
    ["// import x from './b'", false],
    ['const text = "import x from \'./b\'"', false],
    ["const text = `require('./b')`", false],
    ["const regex = /require('./b')/", false],
    ["import type {X} from './b'", false],
    ["import {type X} from './b'", false],
    ["export type {X} from './b'", false],
    ["export {type X} from './b'", false],
    ["function f(require) { require('./b') }", false],
    ["require('./b'); const require = f", false],
    ["const {require} = x; require('./b')", false],
    ["import require from './other'; require('./b')", false],
    ["function require() {}; require('./b')", false],
    ["require(`./b`)", false],
    ["import x from", false],
  ];
  for (const [content, expected] of cases) {
    const snapshot = { files: [{path:"a.tsx", content, size:content.length}, {path:"b.ts", content:"export const x = 1", size:18}] } as Snapshot;
    const index = new SnapshotIndex(snapshot, "sha");
    expect(index.imports("a.tsx", "b.ts"), content).toBe(expected);
    expect(index.imports("a.tsx", "a.tsx")).toBe(false);
  }
  const unsupported = new SnapshotIndex({ files: [{path:"a.vue", content:"import x from './b'", size:19}, {path:"b.ts", content:"", size:0}] } as Snapshot, "sha");
  expect(unsupported.imports("a.vue", "b.ts")).toBe(false);
});
