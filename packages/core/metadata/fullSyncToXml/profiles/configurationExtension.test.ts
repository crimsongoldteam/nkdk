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
    expect(runtime.workerProfile.baseForms).toEqual({
      componentDir: "/project/cf",
      projectFiles: base.hashes.projectFiles,
    })
    expect(Object.keys(runtime)).toEqual(["kind", "target", "base", "workerProfile"])
  })
})

function extensionState(logicalAddresses: readonly string[]): ConfirmedComponentState {
  return state({
    componentPath: "cfe/Дополнение",
    logicalAddresses,
  })
}

function state(params: {
  componentPath: string
  projectFiles?: ConfigurationIndexData["projectFiles"]
  snapshotProjectFiles?: ConfigurationIndexData["projectFiles"]
  identities?: ConfigurationIndexData["identities"]
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
