import { Type } from "typebox"
import { describe, expect, it } from "vitest"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import type { RegisteredProjectSpec } from "../../projectDefinition/projectSpecContracts"
import type { MetadataResourceDeclaration } from "../core/types"
import { describeProjectSpecResourceTopology } from "./ruleTopology"

const rule = {
  itemType: "TestItem",
  itemTypePrefix: "Тест",
  xmlDir: "TestItems",
  properties: {},
} as MetadataItemRule

const source = { kind: "itemRule", description: "test" } as const

function projectSpec(
  projectLayout?: "objectDirectory" | "flatFile",
  resources: readonly MetadataResourceDeclaration[] = [],
): RegisteredProjectSpec {
  return {
    dir: "Тест",
    kind: "test",
    rule,
    exportSchema: () => Type.Object({}),
    ...(projectLayout === undefined ? {} : { projectLayout }),
    resources,
  }
}

describe("project spec resource topology", () => {
  it.each([
    [undefined, "Тест/{ownerName}/Свойства.yaml"],
    ["flatFile", "Тест/{ownerName}.yaml"],
  ] as const)("строит назначение для projectLayout=%s", (projectLayout, projectPattern) => {
    const declarations = describeProjectSpecResourceTopology(projectSpec(projectLayout))

    expect(declarations).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "content", projectPattern, role: "properties" }),
      expect.objectContaining({
        kind: "xmlDocument",
        assignmentProjectPattern: projectPattern,
        xmlPattern: "TestItems/{ownerName}.xml",
      }),
    ]))
  })

  it.each([
    {
      kind: "content",
      projectPattern: "Дополнение.yaml",
      role: "fileItem",
      required: false,
      repeatable: false,
      compositionImpact: "none",
      itemRule: rule,
      source,
    },
    {
      kind: "yamlCompanion",
      assignmentProjectPattern: "",
      projectPattern: "Дополнение.yaml",
      required: false,
      itemRule: rule,
      projectRole: "form",
      indexContribution: "isolated",
      logicalAddressSegment: "Дополнение",
      source,
    },
    {
      kind: "externalFile",
      assignmentProjectPattern: "",
      projectPattern: "Дополнение.bin",
      xmlPattern: "Ext/Дополнение.bin",
      direction: "both",
      transferCapabilityId: "copy",
      compositionImpact: "none",
      source,
    },
  ] satisfies readonly MetadataResourceDeclaration[])(
    "отклоняет дополнительный проектный ресурс $kind",
    (resource) => {
      expect(() => describeProjectSpecResourceTopology(projectSpec("flatFile", [resource]))).toThrow(
        "Плоское размещение Тест не допускает дополнительные проектные ресурсы",
      )
    },
  )

  it("разрешает дополнительный XML-документ", () => {
    const resource = {
      kind: "xmlDocument",
      assignmentProjectPattern: "Тест/{ownerName}.yaml",
      xmlPattern: "TestItems/{ownerName}/Ext/Дополнение.xml",
      role: "property",
      required: false,
      read: { inputRole: "property" },
      prepareCapabilityId: "itemProperty",
      source,
    } as const satisfies MetadataResourceDeclaration

    expect(describeProjectSpecResourceTopology(projectSpec("flatFile", [resource]))).toContain(resource)
  })
})
