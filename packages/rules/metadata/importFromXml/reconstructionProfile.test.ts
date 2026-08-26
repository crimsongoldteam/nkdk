import type {
  ConfigurationIndexBlock,
} from "../configurationIndex"
import type { ConfigurationIndexStore } from "../configurationIndex/store"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/adapters/registeredRules"
import { classifyMetadataProjectPath } from "../resourceTopology/core/projectProjection"
import type { ProjectStateReadSession } from "../projectState"
import { createTestProjectStateReadToken } from "../projectState/tests/readToken"
import { describe, expect, it, vi } from "vitest"
import type { ComponentProjectStructure } from "../project/componentState/types"
import type { ImportAssignment } from "./types"
import { prepareImportXmlReconstructionProfile } from "./reconstructionProfile"

const BASE_CONFIGURATION_UUID = "11111111-1111-4111-8111-111111111111"
const BASE_CATALOG_UUID = "22222222-2222-4222-8222-222222222222"
const BASE_ATTRIBUTE_UUID = "33333333-3333-4333-8333-333333333333"
const TARGET_CATALOG_UUID = "44444444-4444-4444-8444-444444444444"
const TARGET_ATTRIBUTE_UUID = "55555555-5555-4555-8555-555555555555"

describe("prepareImportXmlReconstructionProfile", () => {
  it("builds an exact extension profile from target and base indexes", async () => {
    const sessionClose = vi.fn()
    const projectStateSession = projectStateSessionForExtension(sessionClose)
    const baseClose = vi.fn(async () => undefined)
    const baseIndex = indexStore(baseBlocks(), baseClose)

    const profile = await prepareImportXmlReconstructionProfile({
      address: { kind: "configurationExtension", name: "Дополнение" },
      projectDir: "/project",
      assignments: [catalogAssignment()],
      projectState: { openReadSession: () => projectStateSession },
      projectStateReadToken: createTestProjectStateReadToken(),
      targetIndex: targetIndex(extensionTargetBlocks()),
    }, {
      readBaseStructure: async () => baseStructure(),
      openBaseIndex: () => baseIndex,
    })

    expect(profile.xmlDefaultVariantByLogicalAddress).toMatchObject({
      "Справочник.Товары": "adopted",
      "Справочник.Товары.Реквизит.Артикул": "adopted",
      "Справочник.Товары.Реквизит.Собственный": "full",
    })
    expect(profile.adoptedUuids).toMatchObject({
      Конфигурация: BASE_CONFIGURATION_UUID,
      "Справочник.Товары": BASE_CATALOG_UUID,
      "Справочник.Товары.Реквизит.Артикул": BASE_ATTRIBUTE_UUID,
    })
    expect(baseClose).toHaveBeenCalledOnce()
    expect(sessionClose).toHaveBeenCalledOnce()
  })

  it("builds a configuration profile without opening a base index", async () => {
    const sessionClose = vi.fn()
    const projectStateReadToken = createTestProjectStateReadToken()
    let openedReadToken: typeof projectStateReadToken | undefined
    const openBaseIndex = vi.fn(() => {
      throw new Error("Основной индекс не должен открываться")
    })
    const catalog = catalogAssignment()
    const commonModule = assignment({
      logicalAddress: "CommonModule.Сервис",
      targetProjectPath: "ОбщийМодуль/Сервис/Модуль.bsl",
      itemType: "CommonModule",
      itemName: "Сервис",
    })

    const profile = await prepareImportXmlReconstructionProfile({
      address: { kind: "configuration" },
      projectDir: "/project",
      assignments: [catalog, commonModule],
      projectState: {
        openReadSession: (token) => {
          openedReadToken = token
          return projectStateSession(({ componentPath }) => ({
          entries: componentPath === "cf"
            ? [{
                logicalAddress: "Catalog.Товары.Attribute.Артикул",
                sourceProjectPath: `cf/${catalog.targetProjectPath}`,
              }]
            : [],
          }), sessionClose)
        },
      },
      projectStateReadToken,
      targetIndex: targetIndex(new Map([
        [catalog.targetProjectPath, {
          entities: [
            { logicalAddress: catalog.logicalAddress, uuid: TARGET_CATALOG_UUID },
            { logicalAddress: "Catalog.Товары.Attribute.Артикул" },
          ],
        }],
        [commonModule.targetProjectPath, { entities: [] }],
      ])),
    }, {
      openBaseIndex,
    })

    expect(profile.xmlDefaultVariantByLogicalAddress).toEqual({
      "Справочник.Товары": "indexed",
      "Справочник.Товары.Реквизит.Артикул": "indexed",
      "ОбщийМодуль.Сервис": "full",
    })
    expect(openBaseIndex).not.toHaveBeenCalled()
    expect(openedReadToken).not.toBe(projectStateReadToken)
    expect(sessionClose).toHaveBeenCalledOnce()
  })

  it("closes the base index and ProjectState session when profile construction fails", async () => {
    const sessionClose = vi.fn()
    const baseClose = vi.fn(async () => undefined)

    await expect(prepareImportXmlReconstructionProfile({
      address: { kind: "configurationExtension", name: "Дополнение" },
      projectDir: "/project",
      assignments: [catalogAssignment()],
      projectState: { openReadSession: () => projectStateSessionForExtension(sessionClose) },
      projectStateReadToken: createTestProjectStateReadToken(),
      targetIndex: targetIndex(extensionTargetBlocks()),
    }, {
      readBaseStructure: async () => baseStructure(),
      openBaseIndex: () => indexStore(baseBlocks(), baseClose),
      buildProfile: () => {
        throw new Error("ошибка построения")
      },
    })).rejects.toThrow("ошибка построения")

    expect(baseClose).toHaveBeenCalledOnce()
    expect(sessionClose).toHaveBeenCalledOnce()
  })
})

function projectStateSessionForExtension(close: () => void): ProjectStateReadSession {
  const catalogPath = catalogAssignment().targetProjectPath
  return projectStateSession(({ componentPath }) => ({
    entries: componentPath === "cfe/Дополнение"
      ? [
          {
            logicalAddress: "Catalog.Товары.Attribute.Артикул",
            sourceProjectPath: `cfe/Дополнение/${catalogPath}`,
          },
          {
            logicalAddress: "Catalog.Товары.Attribute.Собственный",
            sourceProjectPath: `cfe/Дополнение/${catalogPath}`,
          },
        ]
      : [{
          logicalAddress: "Catalog.Товары.Attribute.Артикул",
          sourceProjectPath: `cf/${catalogPath}`,
        }],
  }), close)
}

function projectStateSession(
  readComponentTargetPage: ProjectStateReadSession["readComponentTargetPage"],
  close: () => void,
): ProjectStateReadSession {
  return { readComponentTargetPage, close } as ProjectStateReadSession
}

function baseStructure(): ComponentProjectStructure {
  const topology = compileRegisteredMetadataResourceTopology()
  const projectPaths = ["Конфигурация.yaml", catalogAssignment().targetProjectPath]
  const resources = projectPaths.map((projectPath) => {
    const resource = classifyMetadataProjectPath(topology, projectPath)
    if (resource === undefined) throw new Error(`Не распознан тестовый путь: ${projectPath}`)
    return resource
  })
  return {
    address: { kind: "configuration" },
    componentPath: "cf",
    componentDir: "/project/cf",
    topology,
    resources,
    projectPaths,
  }
}

function extensionTargetBlocks(): ReadonlyMap<string, ConfigurationIndexBlock> {
  return new Map([[catalogAssignment().targetProjectPath, {
    entities: [
      { logicalAddress: "Catalog.Товары", uuid: TARGET_CATALOG_UUID },
      { logicalAddress: "Catalog.Товары.Attribute.Артикул", uuid: TARGET_ATTRIBUTE_UUID },
      { logicalAddress: "Catalog.Товары.Attribute.Собственный", uuid: TARGET_ATTRIBUTE_UUID },
    ],
  }]])
}

function baseBlocks(): ReadonlyMap<string, ConfigurationIndexBlock> {
  return new Map([
    ["Конфигурация.yaml", {
      entities: [{ logicalAddress: "Конфигурация", uuid: BASE_CONFIGURATION_UUID }],
    }],
    [catalogAssignment().targetProjectPath, {
      entities: [
        { logicalAddress: "Справочник.Товары", uuid: BASE_CATALOG_UUID },
        { logicalAddress: "Справочник.Товары.Реквизит.Артикул", uuid: BASE_ATTRIBUTE_UUID },
      ],
    }],
  ])
}

function targetIndex(blocks: ReadonlyMap<string, ConfigurationIndexBlock>) {
  return { getBlocks: vi.fn(() => blocks) }
}

function indexStore(
  blocks: ReadonlyMap<string, ConfigurationIndexBlock>,
  close: () => Promise<void>,
): ConfigurationIndexStore {
  return {
    descriptor: () => ({
      dataPath: "/project/.nkdk/components/cf/configuration-index.lmdb",
      lockPath: "/project/.nkdk/components/cf/configuration-index.lmdb-lock",
      schemaVersion: 1,
    }),
    readHashes: () => [],
    getBlocks: vi.fn(() => blocks),
    hasBlock: () => false,
    hasPending: () => false,
    async replaceActiveFrom() {},
    async publishImportedCandidate() {},
    async writePending() {},
    pendingAlreadyApplied: () => false,
    async applyPending() {},
    async clearPending() {},
    async flush() {},
    close,
  }
}

function catalogAssignment(): ImportAssignment {
  return assignment({
    logicalAddress: "Catalog.Товары",
    targetProjectPath: "Справочник/Товары/Свойства.yaml",
    itemType: "Catalog",
    itemName: "Товары",
  })
}

function assignment(params: {
  logicalAddress: string
  targetProjectPath: string
  itemType: string
  itemName: string
}): ImportAssignment {
  return {
    id: params.targetProjectPath,
    topologyAddress: { nodeId: "test", values: {} },
    role: "properties",
    targetProjectPath: params.targetProjectPath,
    itemType: params.itemType,
    itemName: params.itemName,
    logicalAddress: params.logicalAddress,
    owner: undefined,
    xmlFiles: [],
    externalFiles: [],
  }
}
