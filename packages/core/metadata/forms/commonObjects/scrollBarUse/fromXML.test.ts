import { describe, expect, it } from "vitest"
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importTypeRule } from "~/metadata/orchestration"
import "./fromXML"

describe("importScrollBarUseFromXML (ScrollBarUseBoolean)", () => {
  const context = {
    fromXML: {},
  } as unknown as ConfigurationContextFromXML

  const rule = undefined

  it("возвращает undefined для undefined и null", () => {
    expect(importTypeRule("ScrollBarUseBoolean", "importFromXML", context, rule, undefined)).toBeUndefined()
    expect(importTypeRule("ScrollBarUseBoolean", "importFromXML", context, rule, null)).toBeUndefined()
  })

  it("конвертирует true / 'true' в UseAlways", () => {
    expect(importTypeRule("ScrollBarUseBoolean", "importFromXML", context, rule, true)).toBe("UseAlways")
    expect(importTypeRule("ScrollBarUseBoolean", "importFromXML", context, rule, "true")).toBe("UseAlways")
  })

  it("конвертирует false / 'false' в DontUse", () => {
    expect(importTypeRule("ScrollBarUseBoolean", "importFromXML", context, rule, false)).toBe("DontUse")
    expect(importTypeRule("ScrollBarUseBoolean", "importFromXML", context, rule, "false")).toBe("DontUse")
  })

  it("возвращает undefined для неизвестных значений", () => {
    expect(importTypeRule("ScrollBarUseBoolean", "importFromXML", context, rule, "unknown")).toBeUndefined()
    expect(importTypeRule("ScrollBarUseBoolean", "importFromXML", context, rule, 123 as unknown as boolean)).toBeUndefined()
  })
})

