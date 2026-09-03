import { describe, expect, it } from "vitest"
import { createLocalXmlChildOrder } from "./localChildOrder"

describe("позиции проверенных XML-детей", () => {
  it("сохраняет порядок коллекции внутри свойства и не позволяет менять закрытый результат", () => {
    const order = createLocalXmlChildOrder([{ propertyKey: "items" }, { propertyKey: "tail" }])
    order.set("tail", [{ type: "element", name: "Tail", occurrence: 1, sourceId: 5 }])
    order.set("items", [
      { type: "element", name: "Item", occurrence: 2, sourceId: 3 },
      { type: "element", name: "Item", occurrence: 1, sourceId: 2 },
    ])
    const result = order.finish()
    expect(result.map(({ sourceId }) => sourceId)).toEqual([3, 2, 5])
    expect(() => order.set("tail", [])).toThrow(/завершён/)
    expect(order.finish()).toBe(result)
  })

  it("не теряет уже принятый вклад при повторной записи или чужом свойстве", () => {
    const order = createLocalXmlChildOrder([{ propertyKey: "items" }])
    order.set("items", [{ type: "element", name: "Item", occurrence: 1, sourceId: 2 }])
    expect(() => order.set("items", [])).toThrow(/повтор/i)
    expect(() => order.set("unknown", [])).toThrow(/отсутствует/)
    expect(order.finish()).toEqual([{ type: "element", name: "Item", occurrence: 1, sourceId: 2 }])
  })
})
