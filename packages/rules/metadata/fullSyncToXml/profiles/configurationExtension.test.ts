import { describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "@nkdk/runtime"
import { snapshotConfigurationIndex } from "@nkdk/runtime"
import type { ConfigurationSnapshot, ConfigurationSnapshotEntity } from "@nkdk/runtime"
import type { ConfirmedComponentState } from "../../project/componentState/types"
import { createTestProjectStateReadToken } from "../../projectState/tests/readToken"
import { configurationExtensionFullXmlSyncProfile } from "./configurationExtension"
import { configurationFullXmlSyncProfile } from "./configuration"
import { compileRegisteredMetadataResourceTopology } from "../../resourceTopology/adapters/registeredRules"
import { classifyMetadataProjectPath } from "../../resourceTopology/core/projectProjection"

describe("configuration extension full XML sync profile", () => {
  it.each([
    ["Версия8_3_20", "AnyRef"],
    ["Версия8_3_27", "AnyIBRef"],
    [undefined, "AnyIBRef"],
  ] as const)("prepares the TypeDescription policy for %s", (mode, expected) => {
    const target = state({ componentPath: "cfe/Дополнение" })
    const runtime = configurationExtensionFullXmlSyncProfile.confirm({
      target,
      base: state({ componentPath: "cf" }),
    })
    const rootYaml = mode === undefined ? {} : { РежимСовместимостиРасширенияКонфигурации: mode }

    const prepared = configurationExtensionFullXmlSyncProfile.prepareRuntime?.({ runtime, rootYaml })

    expect(prepared?.workerProfile.typeDescriptionXMLNameByType).toEqual({ AnyIBRef: expected })
    expect(prepared?.workerProfile.adoptedUuids).toBe(runtime.workerProfile.adoptedUuids)
  })

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
      "Справочник.Товары": "11111111-1111-4111-8111-111111111111",
    })
  })

  it("adopts a nested object present in current ProjectState component indexes", () => {
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
      "Справочник.Товары": "11111111-1111-4111-8111-111111111111",
      "Справочник.Товары.Реквизит.Артикул": "21111111-1111-4111-8111-111111111111",
    })
    expect(runtime.workerProfile.xmlDefaultVariantByLogicalAddress).toEqual({
      Конфигурация: "indexed",
      "Справочник.Товары": "adopted",
      "Справочник.Товары.Реквизит.Артикул": "adopted",
    })
    expect(runtime.workerProfile).not.toHaveProperty("indexedPropertyOrderByLogicalAddress")
    expect(runtime.workerProfile.baseForms).toEqual({
      componentDir: "/project/cf",
      projectFiles: base.hashes.projectFiles,
      targetProjectFiles: target.hashes.projectFiles,
      snapshot: base.snapshot,
    })
    expect(Object.keys(runtime)).toEqual(["kind", "target", "base", "workerProfile"])
  })

  it.each([
    [
      "Catalog.Товары.Form.ФормаЭлемента",
      "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
      "Справочник/Товары/Формы/ФормаЭлемента/БазоваяФорма.yaml",
    ],
    [
      "CommonForm.ФормаПродаж",
      "ОбщаяФорма/ФормаПродаж/Свойства.yaml",
      "ОбщаяФорма/ФормаПродаж/БазоваяФорма.yaml",
    ],
  ])("records both confirmed sources for borrowed form %s", (logicalAddress, formPath, savedPath) => {
    const topology = compileRegisteredMetadataResourceTopology()
    const targetFiles = [formPath, savedPath].map((projectPath, index) => ({
      projectPath,
      contentHash: BigInt(index + 1),
    }))
    const targetBase = state({ componentPath: "cfe/Дополнение", projectFiles: targetFiles })
    const target: ConfirmedComponentState = {
      ...targetBase,
      structure: {
        ...targetBase.structure,
        topology,
        resources: targetFiles.flatMap(({ projectPath }) => {
          const resource = classifyMetadataProjectPath(topology, projectPath)
          return resource === undefined ? [] : [resource]
        }),
      },
      indexes: {
        ...targetBase.indexes,
        logicalAddresses: [{ logicalAddress, sourceProjectPath: formPath }],
      },
    }
    const base = state({ componentPath: "cf", projectFiles: [{ projectPath: formPath, contentHash: 1n }] })
    const baseWithAddress: ConfirmedComponentState = {
      ...base,
      indexes: {
        ...base.indexes,
        logicalAddresses: [{ logicalAddress, sourceProjectPath: formPath }],
      },
    }

    const runtime = configurationExtensionFullXmlSyncProfile.confirm({ target, base: baseWithAddress })

    expect(runtime.borrowedForms).toEqual([{
      logicalAddress,
      extensionProjectPath: formPath,
      baseProjectPath: formPath,
      savedProjectPath: savedPath,
    }])
    expect(runtime.workerProfile.xmlDefaultVariantByLogicalAddress).toHaveProperty(logicalAddress, "adopted")
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

  it("reads a localized worker entity when the canonical entity is absent", () => {
    const logicalAddress = "Catalog.Товары.Attribute.Артикул"
    const workerLogicalAddress = "Справочник.Товары.Реквизит.Артикул"
    const base = state({
      componentPath: "cf",
      logicalAddresses: [logicalAddress],
      entities: [uuidEntity(workerLogicalAddress, "33333333-3333-4333-8333-333333333333")],
    })
    const target = state({
      componentPath: "cfe/Дополнение",
      logicalAddresses: [logicalAddress],
    })

    const runtime = configurationExtensionFullXmlSyncProfile.confirm({ target, base })

    expect(runtime.workerProfile.adoptedUuids).toEqual({
      [workerLogicalAddress]: "33333333-3333-4333-8333-333333333333",
    })
    expect(runtime.workerProfile.adoptedUuids).not.toHaveProperty(logicalAddress)
  })

  it.each([
    [
      "ExternalDataSource.Источник.Table.Таблица.Field.Поле",
      "ВнешнийИсточникДанных.Источник.Таблица.Таблица.Поле.Поле",
    ],
    [
      "ExternalDataSource.Источник.Table.Таблица.Command.Команда",
      "ВнешнийИсточникДанных.Источник.Таблица.Таблица.Команда.Команда",
    ],
    [
      "ExternalDataSource.Источник.Cube.Куб.DimensionTable.ТаблицаИзмерения.Field.Поле",
      "ВнешнийИсточникДанных.Источник.Куб.Куб.ТаблицаИзмерения.ТаблицаИзмерения.Поле.Поле",
    ],
    [
      "ExternalDataSource.Источник.Cube.Куб.Dimension.Измерение",
      "ВнешнийИсточникДанных.Источник.Куб.Куб.Измерение.Измерение",
    ],
    [
      "ExternalDataSource.Источник.Cube.Куб.Resource.Ресурс",
      "ВнешнийИсточникДанных.Источник.Куб.Куб.Ресурс.Ресурс",
    ],
    [
      "ExternalDataSource.Источник.Cube.Куб.Command.Команда",
      "ВнешнийИсточникДанных.Источник.Куб.Куб.Команда.Команда",
    ],
  ] as const)("projects exact nested address %s to worker address", (canonical, workerLogicalAddress) => {
    const uuid = "44444444-4444-4444-8444-444444444444"
    const base = state({
      componentPath: "cf",
      logicalAddresses: [canonical],
      entities: [uuidEntity(workerLogicalAddress, uuid)],
    })
    const target = state({
      componentPath: "cfe/Дополнение",
      logicalAddresses: [canonical],
    })

    const runtime = configurationExtensionFullXmlSyncProfile.confirm({ target, base })

    expect(runtime.workerProfile.adoptedUuids).toEqual({ [workerLogicalAddress]: uuid })
    expect(runtime.workerProfile.adoptedUuids).not.toHaveProperty(canonical)
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

describe("configuration full XML sync profile", () => {
  it("uses indexed defaults only below metadata items present in the snapshot", () => {
    const existing = "ПланВидовХарактеристик.ВидыСвойств"
    const runtime = configurationFullXmlSyncProfile.confirm({
      target: state({
        componentPath: "cf",
        entities: [
          uuidEntity(existing, "11111111-1111-4111-8111-111111111111"),
          {
            logicalAddress: `${existing}.Характеристики[0].ПолеПутиКДанным`,
            sourceProjectPath: "Свойства.yaml",
            xml: { present: true },
          },
        ],
      }),
    })

    expect(runtime.workerProfile.xmlDefaultVariantByLogicalAddress).toEqual({
      [existing]: "indexed",
    })
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
    specificationVersion: "1.4",
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
      logicalAddresses: (params.logicalAddresses ?? []).map((logicalAddress) => ({
        logicalAddress,
        sourceProjectPath: projectFiles[0]!.projectPath,
      })),
    },
    snapshot: snapshotConfigurationIndex(encodeConfigurationIndex(snapshot)),
    projectStateReadToken: createTestProjectStateReadToken(),
  }
}

function uuidEntity(logicalAddress: string, uuid: string): ConfigurationSnapshotEntity {
  return {
    logicalAddress,
    sourceProjectPath: "Свойства.yaml",
    identities: { uuid },
  }
}
