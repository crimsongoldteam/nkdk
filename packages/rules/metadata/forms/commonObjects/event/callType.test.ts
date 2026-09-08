import { describe, expect, it } from "vitest"
import { eventCallTypeFromYAML, eventCallTypeToYAML } from "./callType"

describe("event call type", () => {
  it.each([
    ["Before", "Перед"],
    ["After", "После"],
    ["Override", "Вместо"],
  ] as const)("сопоставляет %s и %s", (xml, yaml) => {
    expect(eventCallTypeToYAML(xml)).toBe(yaml)
    expect(eventCallTypeFromYAML(yaml)).toBe(xml)
  })

})
