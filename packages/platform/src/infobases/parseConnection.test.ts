import { describe, expect, it } from "vitest"
import { parseConnection } from "./parseConnection"

describe("parseConnection", () => {
  it.each([
    ['File="C:\\Data;Main=1";', { type: "file", path: "C:\\Data;Main=1" }],
    ['Srvr="server:1541";Ref="ERP";', { type: "server", server: "server:1541", reference: "ERP" }],
    ['ws="https://example.test/erp?a=1;b=2";', { type: "web", url: "https://example.test/erp?a=1;b=2" }],
    ['Custom="value";', { type: "unknown", raw: 'Custom="value";' }],
  ] as const)("parses %s", (raw, expected) => {
    expect(parseConnection(raw)).toEqual(expected)
  })
})
