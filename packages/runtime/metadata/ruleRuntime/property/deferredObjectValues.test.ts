import { describe, expect, it } from "vitest"
import { bindDeferredObjectValues, deferredValuePaths } from "./deferredObjectValues"

describe("deferredValuePaths", () => {
  it("отвязывает пути от исходного YAML-дерева", () => {
    const source = { Items: [{ Value: "source" }] }
    const paths = [{
      valuePath: ["Items", 0, "Value"],
      rulePath: [{ propertyKey: "items" }, { propertyKey: "value", nestedItemType: "Item" }],
    }]
    const deferred = bindDeferredObjectValues(source, paths)

    const portable = JSON.parse(JSON.stringify(deferredValuePaths(deferred)))
    const restored = { Items: [{ Value: "restored" }] }
    const rebound = bindDeferredObjectValues(restored, portable)

    expect(rebound[0]?.target).toEqual({ object: restored.Items[0], key: "Value" })
    expect(portable).toEqual(paths)
  })
})
