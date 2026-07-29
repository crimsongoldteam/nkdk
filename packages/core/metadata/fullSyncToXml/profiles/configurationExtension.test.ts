import { describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "../../configurationIndex/encode"
import { snapshotConfigurationIndex } from "../../configurationIndex/sharedSnapshot"
import type { ConfigurationSnapshot, ConfigurationSnapshotEntity } from "../../configurationIndex/types"
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
        target: state({ componentPath: "cfe/Дополнение" }),
        base,
      })
    ).toThrow("основная конфигурация не синхронизирована")
  })

  it("adopts the intersection of current target addresses and base UUID entities", () => {
    const adopted = "Catalog.Товары"
    const withoutUuid = "Catalog.Товары.Form.ФормаЭлемента.Element.Группа"
    const snapshotOnly = "Catalog.Старый"
    const base = state({
      componentPath: "cf",
      logicalAddresses: [adopted, withoutUuid],
      entities: [
        uuidEntity(adopted, "11111111-1111-4111-8111-111111111111"),
        uuidEntity(snapshotOnly, "22222222-2222-4222-8222-222222222222"),
      ],
    })
    const target = state({
      componentPath: "cfe/Дополнение",
      logicalAddresses: [adopted, withoutUuid, snapshotOnly],
    })

    const runtime = configurationExtensionFullXmlSyncProfile.confirm({ target, base })

    expect(runtime.workerProfile.adoptedUuids).toEqual({
      [adopted]: "11111111-1111-4111-8111-111111111111",
    })
  })

  it("exposes only the current extension, base and runtime identities", () => {
    const adopted = ["Catalog.Товары", "Catalog.Товары.Attribute.Артикул"]
    const base = state({
      componentPath: "cf",
      logicalAddresses: adopted,
      entities: adopted.map((logicalAddress, index) =>
        uuidEntity(logicalAddress, `${index + 1}1111111-1111-4111-8111-111111111111`)
      ),
    })
    const target = state({
      componentPath: "cfe/Дополнение",
      logicalAddresses: adopted,
    })

    const runtime = configurationExtensionFullXmlSyncProfile.confirm({ target, base })

    expect(runtime.target).toBe(target)
    expect(runtime.base).toBe(base)
    expect(runtime.workerProfile.adoptedUuids).toEqual({
      "Catalog.Товары": "11111111-1111-4111-8111-111111111111",
      "Catalog.Товары.Attribute.Артикул": "21111111-1111-4111-8111-111111111111",
    })
    expect(runtime.workerProfile.xmlDefaultVariantByLogicalAddress).toEqual({
      Конфигурация: "indexed",
      "Catalog.Товары": "adopted",
      "Catalog.Товары.Attribute.Артикул": "adopted",
    })
    expect(runtime.workerProfile).not.toHaveProperty("indexedPropertyOrderByLogicalAddress")
    expect(runtime.workerProfile.baseForms).toEqual({
      componentDir: "/project/cf",
      projectFiles: base.hashes.projectFiles,
      snapshot: base.snapshot,
    })
    expect(Object.keys(runtime)).toEqual(["kind", "target", "base", "workerProfile"])
  })

  it("does not adopt an address found only in snapshots", () => {
    const logicalAddress = "Catalog.Товары.Form.ФормаЭлемента"
    const base = state({
      componentPath: "cf",
      entities: [uuidEntity(logicalAddress, "11111111-1111-4111-8111-111111111111")],
    })
    const target = state({
      componentPath: "cfe/Дополнение",
      entities: [uuidEntity(logicalAddress, "22222222-2222-4222-8222-222222222222")],
    })

    const runtime = configurationExtensionFullXmlSyncProfile.confirm({ target, base })

    expect(runtime.workerProfile.adoptedUuids).not.toHaveProperty(logicalAddress)
  })

  it("adopts a new current address absent from the old extension snapshot", () => {
    const logicalAddress = "Catalog.Товары.Attribute.Артикул"
    const base = state({
      componentPath: "cf",
      logicalAddresses: [logicalAddress],
      entities: [uuidEntity(logicalAddress, "33333333-3333-4333-8333-333333333333")],
    })
    const target = state({
      componentPath: "cfe/Дополнение",
      logicalAddresses: [logicalAddress],
    })

    const runtime = configurationExtensionFullXmlSyncProfile.confirm({ target, base })

    expect(runtime.workerProfile.adoptedUuids).toEqual({
      [logicalAddress]: "33333333-3333-4333-8333-333333333333",
    })
  })

  it("does not treat the extension root as an adopted base object", () => {
    const base = state({
      componentPath: "cf",
      logicalAddresses: ["Конфигурация"],
      entities: [uuidEntity("Конфигурация", "11111111-1111-4111-8111-111111111111")],
    })
    const target = state({
      componentPath: "cfe/Дополнение",
      logicalAddresses: ["Конфигурация"],
    })

    const runtime = configurationExtensionFullXmlSyncProfile.confirm({ target, base })

    expect(runtime.workerProfile.adoptedUuids).not.toHaveProperty("Конфигурация")
  })

  it("uses the base UUID only when the extension root entity is extended", () => {
    const baseUuid = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
    const base = state({
      componentPath: "cf",
      logicalAddresses: ["Конфигурация"],
      entities: [uuidEntity("Конфигурация", baseUuid)],
    })
    const target = state({
      componentPath: "cfe/Дополнение",
      logicalAddresses: ["Конфигурация"],
      entities: [
        {
          logicalAddress: "Конфигурация",
          sourceProjectPath: "Свойства.yaml",
          xml: { extended: true },
        },
      ],
    })

    const runtime = configurationExtensionFullXmlSyncProfile.confirm({ target, base })

    expect(runtime.workerProfile.adoptedUuids).toHaveProperty("Конфигурация", baseUuid)
    expect(runtime.workerProfile.xmlDefaultVariantByLogicalAddress).toHaveProperty("Конфигурация", "indexed")
  })
})

function state(params: {
  componentPath: string
  projectFiles?: ConfigurationSnapshot["files"]
  snapshotProjectFiles?: ConfigurationSnapshot["files"]
  entities?: readonly ConfigurationSnapshotEntity[]
  logicalAddresses?: readonly string[]
}): ConfirmedComponentState {
  const projectFiles = params.projectFiles ?? [{ projectPath: "Свойства.yaml", contentHash: 1n }]
  const snapshot: ConfigurationSnapshot = {
    specificationVersion: "1.3",
    indexGeneration: 1n,
    componentPath: params.componentPath,
    files: params.snapshotProjectFiles ?? projectFiles,
    entities: params.entities ?? [],
  }
  const address =
    params.componentPath === "cf"
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
      logicalAddresses: (params.logicalAddresses ?? []).map((logicalAddress) => ({
        logicalAddress,
        sourceProjectPath: projectFiles[0]!.projectPath,
      })),
    },
    snapshot: snapshotConfigurationIndex(encodeConfigurationIndex(snapshot)),
  }
}

function uuidEntity(logicalAddress: string, uuid: string): ConfigurationSnapshotEntity {
  return {
    logicalAddress,
    sourceProjectPath: "Свойства.yaml",
    identities: { uuid },
  }
}
