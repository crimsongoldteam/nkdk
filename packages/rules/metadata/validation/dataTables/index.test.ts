import { describe, expect, it } from "vitest"
import type { PendingMetadataTargetReference } from "../projectReferenceIndex"
import { createDataTableIndex, type DataTableDeclaration } from "./index"

describe("data table index", () => {
  it("resolves exact tables and fields of the selected table", () => {
    const index = createDataTableIndex({
      records: [],
      declarations: [
        table("AccumulationRegister.Остатки.Balance", "Balance"),
        table("Task.Задачи", undefined, ["Date"]),
      ],
    })

    expect(index.resolve(reference("AccumulationRegister.Остатки.Balance", {
      kind: "dataTable",
      root: "AccumulationRegister",
      objectName: "Остатки",
      virtualTable: "Balance",
    }, { kind: "dataTable" }))).toEqual({ ok: true })
    expect(index.resolve(reference("AccumulationRegister.Обороты.Balance", {
      kind: "dataTable",
      root: "AccumulationRegister",
      objectName: "Обороты",
      virtualTable: "Balance",
    }, { kind: "dataTable" }))).toMatchObject({ ok: false, reason: "notFound" })
    expect(index.resolve(reference("Date", {
      kind: "dataTableField",
      fieldName: "Date",
    }, { kind: "dataTableField", tableProperty: "table" }), {
      tableCanonical: "Task.Задачи",
    })).toEqual({ ok: true })
  })
})

function table(canonical: string, virtualTable?: string, fieldNames: readonly string[] = []): DataTableDeclaration {
  const [root, objectName] = canonical.split(".")
  const target = {
    kind: "dataTable" as const,
    root: root as "AccumulationRegister" | "Task",
    objectName: objectName!,
    ...(virtualTable === undefined ? {} : { virtualTable }),
  }
  return {
    canonical,
    target,
    result: { ok: true },
    fields: fieldNames.map((fieldName) => ({
      canonical: `${canonical}.StandardAttribute.${fieldName}`,
      target: { kind: "dataTableField", fieldName },
      result: { ok: true },
    })),
  }
}

function reference(
  canonical: string,
  target: PendingMetadataTargetReference["target"],
  constraint: PendingMetadataTargetReference["constraint"],
): PendingMetadataTargetReference {
  return {
    filePath: "/project/test.yaml",
    yamlPath: ["Поле"],
    canonical,
    target,
    constraint,
  }
}
