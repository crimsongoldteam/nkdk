import { describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "../../configurationIndex/encode"
import { snapshotConfigurationIndex } from "../../configurationIndex/sharedSnapshot"
import { sampleIndex } from "../../configurationIndex/testData"
import type { ConfigurationIndexData } from "../../configurationIndex/types"
import type { ConfirmedComponentState } from "../../project/componentState/types"
import { configurationExtensionFullXmlSyncProfile } from "./configurationExtension"

describe("configuration extension full XML sync profile", () => {
  it("rejects a base configuration changed after its snapshot", () => {
    const base = state({
      componentPath: "cf",
      projectFiles: [{ projectPath: "Конфигурация.yaml", contentHash: 1n }],
      snapshotProjectFiles: [{ projectPath: "Конфигурация.yaml", contentHash: 2n }],
    })

    expect(() =>
      configurationExtensionFullXmlSyncProfile.confirm({
        target: extensionState([]),
        base,
      })
    ).toThrow("основная конфигурация не синхронизирована")
  })

  it("requires the base UUID of an adopted object and child attribute", () => {
    const adopted = [
      "Catalog.Товары",
      "Catalog.Товары.Attribute.Артикул",
    ]
    const baseWithoutAttributeUuid = state({
      componentPath: "cf",
      logicalAddresses: adopted,
      identities: [
        {
          logicalAddress: "Catalog.Товары",
          kind: "uuid",
          value: "11111111-1111-1111-1111-111111111111",
        },
      ],
    })

    expect(() =>
      configurationExtensionFullXmlSyncProfile.confirm({
        target: extensionState(adopted),
        base: baseWithoutAttributeUuid,
      })
    ).toThrow('Не найден UUID заимствованного элемента "Catalog.Товары.Attribute.Артикул"')
  })

  it("exposes only the target extension and its base configuration", () => {
    const adopted = ["Catalog.Товары", "Catalog.Товары.Attribute.Артикул"]
    const base = state({
      componentPath: "cf",
      logicalAddresses: adopted,
      identities: adopted.map((logicalAddress, index) => ({
        logicalAddress,
        kind: "uuid" as const,
        value: `${index + 1}1111111-1111-1111-1111-111111111111`,
      })),
    })
    const target = extensionState(adopted)

    const runtime = configurationExtensionFullXmlSyncProfile.confirm({ target, base })

    expect(runtime.target).toBe(target)
    expect(runtime.base).toBe(base)
    expect(runtime.workerProfile.adoptedUuids).toEqual({
      "Catalog.Товары": "11111111-1111-1111-1111-111111111111",
      "Catalog.Товары.Attribute.Артикул": "21111111-1111-1111-1111-111111111111",
    })
    expect(runtime.workerProfile.xmlDefaultVariantByLogicalAddress).toEqual({
      "Catalog.Товары": "adopted",
      "Catalog.Товары.Attribute.Артикул": "adopted",
    })
    expect(runtime.workerProfile.baseForms).toEqual({
      componentDir: "/project/cf",
      projectFiles: base.hashes.projectFiles,
    })
    expect(Object.keys(runtime)).toEqual(["kind", "target", "base", "workerProfile"])
  })

  it("does not require a UUID for a shared form element without an identity", () => {
    const formElement = "Catalog.Товары.Form.ФормаЭлемента.Element.Группа"
    const base = state({
      componentPath: "cf",
      logicalAddresses: [formElement],
    })
    const target = state({
      componentPath: "cfe/Дополнение",
      logicalAddresses: [formElement],
    })

    const runtime = configurationExtensionFullXmlSyncProfile.confirm({
      target,
      base,
    })

    expect(runtime.workerProfile.adoptedUuids).toEqual({})
  })

  it("does not adopt an existing same-name object without ObjectBelonging in the cfe snapshot", () => {
    const logicalAddress = "Catalog.Товары.Form.ФормаЭлемента"
    const base = state({
      componentPath: "cf",
      logicalAddresses: [logicalAddress],
      identities: [{
        logicalAddress,
        kind: "uuid",
        value: "11111111-1111-4111-8111-111111111111",
      }],
    })
    const target = state({
      componentPath: "cfe/Дополнение",
      logicalAddresses: [logicalAddress],
      identities: [{
        logicalAddress,
        kind: "uuid",
        value: "22222222-2222-4222-8222-222222222222",
      }],
      xmlNodes: [{ logicalAddress, order: ["name", "formType", "uuid"] }],
    })

    const runtime = configurationExtensionFullXmlSyncProfile.confirm({ target, base })

    expect(runtime.workerProfile.adoptedUuids).not.toHaveProperty(logicalAddress)
  })

  it("adopts new current metadata elements that are absent from the old cfe snapshot", () => {
    const currentAddresses = [
      "Catalog.Товары",
      "Catalog.Товары.Attribute.Артикул",
      "Catalog.Товары.Form.ФормаЭлемента",
    ]
    const base = state({
      componentPath: "cf",
      logicalAddresses: currentAddresses,
      identities: currentAddresses.map((logicalAddress, index) => ({
        logicalAddress,
        kind: "uuid" as const,
        value: `bbbbbbbb-bbbb-4bbb-8bbb-${index.toString(16).padStart(12, "0")}`,
      })),
    })
    const target = state({
      componentPath: "cfe/Дополнение",
      logicalAddresses: currentAddresses,
      identities: [],
    })

    const runtime = configurationExtensionFullXmlSyncProfile.confirm({
      target,
      base,
    })

    expect(runtime.workerProfile.adoptedUuids).toEqual(
      Object.fromEntries(
        currentAddresses.map((logicalAddress, index) => [
          logicalAddress,
          `bbbbbbbb-bbbb-4bbb-8bbb-${index.toString(16).padStart(12, "0")}`,
        ])
      )
    )
  })

  it("includes snapshot addresses used by nested YAML-to-XML rules", () => {
    const canonical = "Catalog.Товары.Attribute.Артикул"
    const snapshotAddress = "Справочник.Товары.Реквизит.Артикул"
    const base = state({
      componentPath: "cf",
      logicalAddresses: [canonical],
      identities: [
        {
          logicalAddress: canonical,
          kind: "uuid",
          value: "33333333-3333-4333-8333-333333333333",
        },
        {
          logicalAddress: snapshotAddress,
          kind: "uuid",
          value: "11111111-1111-4111-8111-111111111111",
        },
      ],
    })
    const target = state({
      componentPath: "cfe/Дополнение",
      logicalAddresses: [canonical],
      identities: [{
        logicalAddress: snapshotAddress,
        kind: "uuid",
        value: "22222222-2222-4222-8222-222222222222",
      }],
      xmlNodes: [{
        logicalAddress: snapshotAddress,
        order: ["objectBelonging", "name", "extendedConfigurationObject", "uuid"],
      }],
    })

    const runtime = configurationExtensionFullXmlSyncProfile.confirm({
      target,
      base,
    })

    expect(runtime.workerProfile.adoptedUuids[snapshotAddress])
      .toBe("11111111-1111-4111-8111-111111111111")
  })

  it("does not treat the extension root as an adopted base object", () => {
    const base = state({
      componentPath: "cf",
      logicalAddresses: ["Конфигурация"],
      identities: [{
        logicalAddress: "Конфигурация",
        kind: "uuid",
        value: "11111111-1111-4111-8111-111111111111",
      }],
    })
    const target = extensionState(["Конфигурация"])

    const runtime = configurationExtensionFullXmlSyncProfile.confirm({ target, base })

    expect(runtime.workerProfile.adoptedUuids).not.toHaveProperty("Конфигурация")
  })
})

function extensionState(logicalAddresses: readonly string[]): ConfirmedComponentState {
  return state({
    componentPath: "cfe/Дополнение",
    logicalAddresses,
    identities: logicalAddresses.map((logicalAddress, index) => ({
      logicalAddress,
      kind: "uuid" as const,
      value: `eeeeeeee-eeee-4eee-8eee-${index.toString(16).padStart(12, "0")}`,
    })),
    xmlNodes: logicalAddresses.map((logicalAddress) => ({
      logicalAddress,
      order: ["objectBelonging", "name", "extendedConfigurationObject", "uuid"],
    })),
  })
}

function state(params: {
  componentPath: string
  projectFiles?: ConfigurationIndexData["projectFiles"]
  snapshotProjectFiles?: ConfigurationIndexData["projectFiles"]
  identities?: ConfigurationIndexData["identities"]
  xmlNodes?: ConfigurationIndexData["xmlNodes"]
  logicalAddresses?: readonly string[]
}): ConfirmedComponentState {
  const data = sampleIndex()
  const projectFiles = params.projectFiles ?? [
    { projectPath: "Свойства.yaml", contentHash: 1n },
  ]
  const indexData: ConfigurationIndexData = {
    ...data,
    binding: { ...data.binding, componentPath: params.componentPath },
    projectFiles: params.snapshotProjectFiles ?? projectFiles,
    identities: params.identities ?? [],
    xmlNodes: params.xmlNodes ?? [],
    localIndexes: {
      ...data.localIndexes,
      dependencies: [],
      logicalAddresses: (params.logicalAddresses ?? []).map((logicalAddress) => ({
        logicalAddress,
        sourceProjectPath: projectFiles[0]!.projectPath,
      })),
    },
  }
  const address = params.componentPath === "cf"
    ? { kind: "configuration" as const }
    : { kind: "configurationExtension" as const, name: "Дополнение" }
  return {
    structure: {
      address,
      componentPath: params.componentPath,
      componentDir: `/project/${params.componentPath}`,
      topology: {} as ConfirmedComponentState["structure"]["topology"],
      resources: [],
      projectPaths: projectFiles.map(({ projectPath }) => projectPath),
    },
    hashes: { componentPath: params.componentPath, projectFiles },
    indexes: {
      componentPath: params.componentPath,
      sourceProjectFiles: projectFiles,
      metadata: {} as ConfirmedComponentState["indexes"]["metadata"],
      dependencies: [],
      logicalAddresses: indexData.localIndexes.logicalAddresses,
    },
    snapshot: snapshotConfigurationIndex(encodeConfigurationIndex(indexData)),
  }
}
