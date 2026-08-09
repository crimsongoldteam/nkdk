import { describe, expect, it } from "vitest"
import type { MetadataItemRule } from "../ruleRuntime/property/types"
import { compileMetadataResourceTopology } from "../resourceTopology/core/compiler"
import {
  createPartialXmlPackagePolicyRegistry,
  type PartialXmlPackagePolicyRegistration,
} from "./packagePolicy"

const itemRule = { itemType: "Test", properties: {} } as MetadataItemRule
const source = { kind: "itemRule" as const, description: "test" }

function topology() {
  return compileMetadataResourceTopology([{
    resources: [
      {
        kind: "content" as const,
        projectPattern: "Объекты/{ownerName}/Формы/{itemName}/Форма.yaml",
        role: "fileItem" as const,
        required: true,
        repeatable: true,
        compositionImpact: "none" as const,
        itemRule,
        source,
      },
      {
        kind: "xmlDocument" as const,
        assignmentProjectPattern: "",
        xmlPattern: "Objects/{ownerName}/Forms/{itemName}.xml",
        role: "metadata" as const,
        required: true,
        prepareCapabilityId: "test",
        source,
      },
      {
        kind: "xmlDocument" as const,
        assignmentProjectPattern: "",
        xmlPattern: "Objects/{ownerName}/Forms/{itemName}/Ext/Form.xml",
        role: "body" as const,
        required: true,
        prepareCapabilityId: "test",
        source,
      },
      {
        kind: "externalFile" as const,
        assignmentProjectPattern: "",
        projectPattern: "Объекты/{ownerName}/Формы/{itemName}/Модуль.bsl",
        xmlPattern: "Objects/{ownerName}/Forms/{itemName}/Ext/Form/Module.bsl",
        direction: "both" as const,
        transferCapabilityId: "test",
        compositionImpact: "none" as const,
        source,
      },
    ],
  }])
}

const formPolicy: PartialXmlPackagePolicyRegistration = {
  assignment: {
    assignmentPattern: "{ownerPath...}/Формы/{itemName}/Форма.yaml",
    loadDocumentRoles: ["metadata"],
  },
  externalFiles: [{
    projectPattern: "{ownerPath...}/Формы/{itemName}/{relativePath...}",
    loadTarget: true,
  }],
}

describe("partial XML package policy registry", () => {
  it("отвергает повторную регистрацию одного шаблона задания", () => {
    const registry = createPartialXmlPackagePolicyRegistry()
    registry.register(formPolicy)

    expect(() => registry.register(formPolicy)).toThrow("уже зарегистрирована")
  })

  it("разрешает политику по стабильным ID скомпилированных деклараций", () => {
    const registry = createPartialXmlPackagePolicyRegistry()
    registry.register(formPolicy)
    const compiled = topology()
    const resolved = registry.resolve(compiled)
    const assignment = compiled.assignments[0]!

    expect(resolved.assignments.get(assignment.id)).toEqual({
      assignmentId: assignment.id,
      loadDocumentIds: [assignment.xmlDocuments[0]!.id],
      companionDocuments: [],
      companionReferences: [],
    })
    expect(resolved.externalFiles.get(assignment.externalFiles[0]!.id)).toEqual({
      externalFileId: assignment.externalFiles[0]!.id,
      loadTarget: true,
    })
    expect(Object.isFrozen(resolved.assignments.get(assignment.id))).toBe(true)
    expect(Object.isFrozen(resolved.assignments.get(assignment.id)?.loadDocumentIds)).toBe(true)
    expect("set" in resolved.assignments).toBe(false)
    expect("set" in resolved.externalFiles).toBe(false)
  })

  it("останавливается на отсутствующем или неоднозначном шаблоне", () => {
    const missing = createPartialXmlPackagePolicyRegistry()
    missing.register({ assignment: { assignmentPattern: "Нет.yaml", loadDocumentRoles: [] } })
    expect(() => missing.resolve(topology())).toThrow("не найден")

    const ambiguous = createPartialXmlPackagePolicyRegistry()
    ambiguous.register(formPolicy)
    ambiguous.register({
      assignment: { assignmentPattern: "Объекты/{ownerName}/{tail...}", loadDocumentRoles: [] },
    })
    expect(() => ambiguous.resolve(topology())).toThrow("несколько политик")
  })
})
