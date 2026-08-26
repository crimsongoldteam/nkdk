import { describe, expect, it } from "vitest"
import type { ConfigurationIndexBlockEntity, ConfigurationProjectFile } from "@nkdk/runtime"
import { createLocalConfigurationIndexReader } from "../../configurationIndex"
import type { ConfirmedComponentState } from "../../project/componentState/types"
import { createTestProjectStateReadToken } from "../../projectState/tests/readToken"
import {
  configurationExtensionFullXmlSyncProfile,
  confirmConfigurationExtensionFullXmlSync,
} from "./configurationExtension"
import { confirmConfigurationFullXmlSync } from "./configuration"
import { compileRegisteredMetadataResourceTopology } from "../../resourceTopology/adapters/registeredRules"
import { classifyMetadataProjectPath } from "../../resourceTopology/core/projectProjection"
import { formatCanonicalMetadataTargetToYAML } from "../../ruleRuntime/metadataTarget"

const blockEntitiesByStore = new Map<string, readonly ConfigurationIndexBlockEntity[]>()
const DEFAULT_BASE_CONFIGURATION_UUID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"

describe("configuration extension full XML sync profile", () => {
  it.each([
    ["Версия8_3_20", "AnyRef"],
    ["Версия8_3_27", "AnyIBRef"],
    [undefined, "AnyIBRef"],
  ] as const)("prepares the TypeDescription policy for %s", (mode, expected) => {
    const target = state({ componentPath: "cfe/Дополнение" })
    const runtime = confirmExtension({
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
      confirmExtension({
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

    const runtime = confirmExtension({ target, base })

    expect(runtime.workerProfile.adoptedUuids).toEqual({
      Конфигурация: DEFAULT_BASE_CONFIGURATION_UUID,
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

    const runtime = confirmExtension({ target, base })

    expect(runtime.target).toBe(target)
    expect(runtime.base).toBe(base)
    expect(runtime.workerProfile.adoptedUuids).toEqual({
      Конфигурация: DEFAULT_BASE_CONFIGURATION_UUID,
      "Справочник.Товары": "11111111-1111-4111-8111-111111111111",
      "Справочник.Товары.Реквизит.Артикул": "21111111-1111-4111-8111-111111111111",
    })
    expect(runtime.workerProfile.xmlDefaultVariantByLogicalAddress).toEqual({
      Конфигурация: "adopted",
      "Справочник.Товары": "adopted",
      "Справочник.Товары.Реквизит.Артикул": "adopted",
    })
    expect(runtime.workerProfile).not.toHaveProperty("indexedPropertyOrderByLogicalAddress")
    expect(runtime.workerProfile.baseForms).toEqual({
      componentDir: "/project/cf",
      projectFiles: base.hashes.projectFiles,
      targetProjectFiles: target.hashes.projectFiles,
      snapshot: base.snapshot.descriptor,
    })
    expect(Object.keys(runtime)).toEqual(["kind", "target", "base", "workerProfile"])
  })

  it("assigns an explicit default variant to borrowed and own target objects", () => {
    const borrowed = "Catalog.Заимствованный"
    const own = "Catalog.Собственный"
    const base = state({
      componentPath: "cf",
      logicalAddresses: [borrowed],
      entities: [uuidEntity(borrowed, "11111111-1111-4111-8111-111111111111")],
    })
    const target = state({
      componentPath: "cfe/Дополнение",
      logicalAddresses: [borrowed, own],
    })

    const runtime = confirmExtension({ target, base })

    expect(runtime.workerProfile.xmlDefaultVariantByLogicalAddress).toEqual({
      Конфигурация: "adopted",
      "Справочник.Заимствованный": "adopted",
      "Справочник.Собственный": "full",
    })
  })

  it("rejects a borrowed UUID-bearing object without a base UUID", () => {
    const borrowed = "Catalog.Заимствованный"
    const base = state({
      componentPath: "cf",
      logicalAddresses: ["Конфигурация", borrowed],
      entities: [uuidEntity("Конфигурация", "11111111-1111-4111-8111-111111111111")],
    })
    const target = state({
      componentPath: "cfe/Дополнение",
      logicalAddresses: ["Конфигурация", borrowed],
      entities: [uuidEntity(borrowed, "22222222-2222-4222-8222-222222222222")],
    })

    expect(() => confirmExtension({ target, base })).toThrow(
      "Не найден UUID основной конфигурации: Справочник.Заимствованный",
    )
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

    const runtime = confirmExtension({ target, base: baseWithAddress })

    expect(runtime.borrowedForms).toEqual([{
      logicalAddress,
      extensionProjectPath: formPath,
      baseProjectPath: formPath,
      savedProjectPath: savedPath,
    }])
    expect(runtime.workerProfile.xmlDefaultVariantByLogicalAddress).toHaveProperty(
      formatCanonicalMetadataTargetToYAML(logicalAddress) ?? logicalAddress,
      "adopted",
    )
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

    const runtime = confirmExtension({ target, base })

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

    const runtime = confirmExtension({ target, base })

    expect(runtime.workerProfile.adoptedUuids).toEqual({
      Конфигурация: DEFAULT_BASE_CONFIGURATION_UUID,
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

    const runtime = confirmExtension({ target, base })

    expect(runtime.workerProfile.adoptedUuids).toEqual({
      Конфигурация: DEFAULT_BASE_CONFIGURATION_UUID,
      [workerLogicalAddress]: uuid,
    })
    expect(runtime.workerProfile.adoptedUuids).not.toHaveProperty(canonical)
  })

  it("requires the base UUID for the extension root", () => {
    const base = state({
      componentPath: "cf",
      logicalAddresses: ["Конфигурация"],
      entities: [uuidEntity("Конфигурация", "11111111-1111-4111-8111-111111111111")],
    })
    const target = state({
      componentPath: "cfe/Дополнение",
      logicalAddresses: ["Конфигурация"],
    })

    const runtime = confirmExtension({ target, base })

    expect(runtime.workerProfile.adoptedUuids).toHaveProperty(
      "Конфигурация",
      "11111111-1111-4111-8111-111111111111",
    )
  })

  it("uses the base UUID for the extension root without snapshot XML flags", () => {
    const baseUuid = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
    const base = state({
      componentPath: "cf",
      logicalAddresses: ["Конфигурация"],
      entities: [uuidEntity("Конфигурация", baseUuid)],
    })
    const target = state({
      componentPath: "cfe/Дополнение",
      logicalAddresses: ["Конфигурация"],
    })

    const runtime = confirmExtension({ target, base })

    expect(runtime.workerProfile.adoptedUuids).toHaveProperty("Конфигурация", baseUuid)
    expect(runtime.workerProfile.xmlDefaultVariantByLogicalAddress).toHaveProperty("Конфигурация", "adopted")
  })
})

describe("configuration full XML sync profile", () => {
  it("uses indexed defaults only below metadata items present in the snapshot", () => {
    const existing = "ПланВидовХарактеристик.ВидыСвойств"
    const nested = `${existing}.Характеристики[0].ПолеПутиКДанным`
    const runtime = confirmConfigurationFullXmlSync({
      target: state({
        componentPath: "cf",
        logicalAddresses: [existing, nested, "Catalog.Товары"],
        entities: [
          uuidEntity(existing, "11111111-1111-4111-8111-111111111111"),
          {
            logicalAddress: nested,
          },
        ],
      }),
    }, testIndexReader)

    expect(runtime.workerProfile.xmlDefaultVariantByLogicalAddress).toEqual({
      [existing]: "indexed",
      [nested]: "indexed",
      "Справочник.Товары": "full",
    })
  })
})

function state(params: {
  componentPath: string
  projectFiles?: readonly ConfigurationProjectFile[]
  snapshotProjectFiles?: readonly ConfigurationProjectFile[]
  entities?: readonly ConfigurationIndexBlockEntity[]
  logicalAddresses?: readonly string[]
}): ConfirmedComponentState {
  const projectFiles = params.projectFiles ?? [{ projectPath: "Свойства.yaml", contentHash: 1n }]
  const dataPath = `/project/.nkdk/components/${params.componentPath}/configuration-index.lmdb`
  const address =
    params.componentPath === "cf"
      ? { kind: "configuration" as const }
      : { kind: "configurationExtension" as const, name: "Дополнение" }
  const entities = params.entities ?? []
  blockEntitiesByStore.set(
    dataPath,
    address.kind === "configuration" && !entities.some(({ logicalAddress }) => logicalAddress === "Конфигурация")
      ? [uuidEntity("Конфигурация", DEFAULT_BASE_CONFIGURATION_UUID), ...entities]
      : entities,
  )
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
    snapshot: {
      descriptor: {
        dataPath,
        lockPath: `${dataPath}-lock`,
        schemaVersion: 1,
      },
      projectFiles: params.snapshotProjectFiles ?? projectFiles,
    },
    projectStateReadToken: createTestProjectStateReadToken(),
  }
}

function uuidEntity(logicalAddress: string, uuid: string): ConfigurationIndexBlockEntity {
  return {
    logicalAddress,
    uuid,
  }
}

function confirmExtension(
  params: Parameters<typeof confirmConfigurationExtensionFullXmlSync>[0],
) {
  return confirmConfigurationExtensionFullXmlSync(params, testIndexReader)
}

function testIndexReader(state: ConfirmedComponentState) {
  const entities = blockEntitiesByStore.get(state.snapshot.descriptor.dataPath) ?? []
  return createLocalConfigurationIndexReader(new Map([["Свойства.yaml", { entities }]]))
}
