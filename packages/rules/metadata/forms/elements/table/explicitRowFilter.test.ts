import { describe,expect,it } from "vitest"
import { classifyTableSource } from "../../clientApplicationForm/tableSourceProfile"

describe("explicit RowFilter", () => {

  it.each([
    ["DynamicList", "formAttribute", 1, "dynamicList"],
    ["ValueTable", "formAttribute", 1, "rowFilter"],
    ["TabularSection", "objectField", 2, "rowFilter"],
    ["RegisterRecordSet", "registerRecordSet", 1, "rowFilter"],
    ["Registered", "tableColumn", 3, "none"],
    ["DynamicList", "tableColumn", 2, "none"],
  ] as const)("classifies %s from %s as %s", (kind, sourceKind, segmentCount, expected) => {
    expect(classifyTableSource({
      dataPath: "Путь",
      index: { getRoot: () => undefined },
      resolve: () => ({
        status: "ok",
        target: {
          segments: Array.from({ length: segmentCount }, (_, index) => String(index)),
          source: { kind: sourceKind },
          typeInfo: { nextTypes: [], table: { kind } },
        },
      }),
    })).toBe(expected)
  })

  it("uses the merged form index when the extension resolver cannot see a base form attribute", () => {
    expect(classifyTableSource({
      dataPath: "Список",
      index: {
        getRoot: () => ({ typeInfo: { table: { kind: "DynamicList" } } }),
      },
      resolve: () => ({ status: "error" }),
    })).toBe("dynamicList")
  })

  it("uses the merged form index when the extension resolver returns no target", () => {
    expect(classifyTableSource({
      dataPath: "Список",
      index: {
        getRoot: () => ({ typeInfo: { table: { kind: "DynamicList" } } }),
      },
      resolve: () => ({ status: "warning" }),
    })).toBe("dynamicList")
  })
})
