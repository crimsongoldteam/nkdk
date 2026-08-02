import { beforeAll, describe, expect, it } from "vitest"
import type { MetadataItemRule } from "../orchestration/property/types"
import type { MetadataResourceDeclaration } from "../resourceTopology/types"
import {
  createProjectStateCompatibility,
  fingerprintProjectStateRuleSources,
  fingerprintProjectStateRulesSnapshot,
} from "./compatibility"

describe("ProjectState compatibility", () => {
  let coreCompatibility: ReturnType<typeof createProjectStateCompatibility>

  beforeAll(() => {
    coreCompatibility = createProjectStateCompatibility("producer-test")
  })

  it("стабилизирует отпечаток относительно порядка регистраций", () => {
    const first = fingerprintProjectStateRulesSnapshot({
      projectSpecs: [{ dir: "Б", kind: "b" }, { dir: "А", kind: "a" }],
      schemas: { B: { type: "string" }, A: { type: "number", required: ["b", "a"] } },
      localRules: ["second", "first"],
    })
    const second = fingerprintProjectStateRulesSnapshot({
      localRules: ["first", "second"],
      schemas: { A: { required: ["b", "a"], type: "number" }, B: { type: "string" } },
      projectSpecs: [{ kind: "a", dir: "А" }, { kind: "b", dir: "Б" }],
    })
    const changedSchema = fingerprintProjectStateRulesSnapshot({
      projectSpecs: [{ dir: "А", kind: "a" }, { dir: "Б", kind: "b" }],
      schemas: { A: { required: ["b", "a"], type: "boolean" }, B: { type: "string" } },
      localRules: ["first", "second"],
    })

    expect(first).toBe(second)
    expect(changedSchema).not.toBe(first)
  })

  it("формирует полный набор отпечатков после регистрации core metadata", () => {
    expect(coreCompatibility).toEqual({
      schemaVersion: 1,
      producerVersion: "producer-test",
      rulesFingerprint: expect.stringMatching(/^[a-f0-9]{64}$/),
      hashAlgorithm: "xxhash64-be-v1",
    })
  })

  it("меняет отпечаток при изменении resources и декларативных project/form rules под прежними ключами", () => {
    const initial = fingerprintProjectStateRulesSnapshot(snapshot(semantics()))

    const changedResource = semantics()
    const ignoredResource = changedResource.resources[1]
    if (ignoredResource?.kind !== "ignore") throw new Error("Ожидался ignore resource")
    changedResource.resources[1] = { ...ignoredResource, pattern: "Изменённый/**" }
    const resourceFingerprint = fingerprintProjectStateRulesSnapshot(snapshot(changedResource))

    const changedProjectRule = semantics()
    changedProjectRule.projectRule.properties["value"]!.xml = "ChangedValue"
    const projectRuleFingerprint = fingerprintProjectStateRulesSnapshot(snapshot(changedProjectRule))

    const changedFormRule = semantics()
    changedFormRule.formRule.properties["value"]!.xml = "ChangedFormValue"
    const formRuleFingerprint = fingerprintProjectStateRulesSnapshot(snapshot(changedFormRule))

    expect([resourceFingerprint, projectRuleFingerprint, formRuleFingerprint]).not.toContain(initial)
    expect(new Set([resourceFingerprint, projectRuleFingerprint, formRuleFingerprint]).size).toBe(3)
  })

  it("меняет отпечаток при изменении исходника local handler по прежнему относительному пути", () => {
    const first = fingerprintProjectStateRuleSources([
      { path: "commonObjects/sample/handler.ts", content: "export const handler = () => 'first'" },
    ])
    const second = fingerprintProjectStateRuleSources([
      { path: "commonObjects/sample/handler.ts", content: "export const handler = () => 'second'" },
    ])

    expect(second).not.toBe(first)
  })

  it("однозначно кодирует отсортированные пути и содержимое исходников", () => {
    const actual = fingerprintProjectStateRuleSources([
      { path: "z/rule.ts", content: "export const z = 2" },
      { path: "a/rule.ts", content: "export const a = 1" },
    ])

    expect(actual).toBe("4e162e5db643f93bf14aecb9741a3fbc1f0d04e8441ed9a1713308e794ea74f3")
  })
})

function semantics(): {
  projectRule: MetadataItemRule
  formRule: MetadataItemRule
  resources: MetadataResourceDeclaration[]
} {
  const projectRule = metadataRule("CompatibilityProject", "Value")
  const formRule = metadataRule("CompatibilityForm", "FormValue")
  const source = { kind: "projectSpec", description: "compatibility test" } as const
  return {
    projectRule,
    formRule,
    resources: [
      {
        kind: "content",
        projectPattern: "Формы/{itemName}.yaml",
        role: "fileItem",
        required: false,
        repeatable: true,
        compositionImpact: "none",
        projectRole: "form",
        itemRule: formRule,
        source,
      },
      { kind: "ignore", side: "project", pattern: "Старый/**", source },
    ],
  }
}

function metadataRule(itemType: string, xml: string): MetadataItemRule {
  return {
    itemType,
    itemTypePrefix: itemType,
    xmlDir: itemType,
    properties: { value: { type: "string", yaml: "Значение", xml } },
  }
}

function snapshot(value: ReturnType<typeof semantics>) {
  return {
    projectSpecs: [{
      dir: "__project_state_compatibility__",
      kind: "compatibility-test",
      rule: value.projectRule,
      resources: value.resources,
    }],
    schemas: { project: value.projectRule },
    localRules: [{ kind: "form", key: "compatibility-form", rule: value.formRule }],
  }
}
