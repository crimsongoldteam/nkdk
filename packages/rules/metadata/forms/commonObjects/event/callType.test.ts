import { describe, expect, it } from "vitest"
import { eventBindingKey, eventCallTypeFromYAML, eventCallTypeToYAML, parseEventBindingKey } from "./callType"

describe("event call type", () => {
  it.each([
    ["Before", "Перед"],
    ["After", "После"],
    ["Override", "Вместо"],
  ] as const)("сопоставляет %s и %s", (xml, yaml) => {
    expect(eventCallTypeToYAML(xml)).toBe(yaml)
    expect(eventCallTypeFromYAML(yaml)).toBe(xml)
  })

  it("строит разные ключи для одного события с разными режимами", () => {
    expect(eventBindingKey("onChange")).not.toBe(eventBindingKey("onChange", "Before"))
    expect(eventBindingKey("onChange", "Before")).not.toBe(eventBindingKey("onChange", "After"))
  })

  it("восстанавливает событие и режим из ключа", () => {
    expect(parseEventBindingKey(eventBindingKey("onChange", "Override"))).toEqual({
      eventKey: "onChange",
      callType: "Override",
    })
  })

  it.each(['["onChange"]', '["",null]', '["onChange","Unexpected"]'])(
    "отклоняет недопустимый составной ключ %s",
    (key) => {
      expect(() => parseEventBindingKey(key)).toThrow()
    }
  )
})
