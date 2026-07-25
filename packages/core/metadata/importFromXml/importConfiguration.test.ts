import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { mockContextFromXML } from "../../tests/mockContext"
import {
  configurationIndexPath,
  type ConfigurationIndexData,
} from "../configurationIndex"
import type { ComponentAddress } from "../components/address"
import type { ValidationOwnerFacts } from "../validation/dataPath/ownerFacts"
import { createImportSharedMetadata } from "./metadataSnapshot"
import type { LayeredImportReferenceSnapshot } from "./componentReferenceIndex"
import {
  importConfigurationFromXml,
  type ImportConfigurationFromXmlParams,
  type ImportCoordinatorDependencies,
} from "./importConfiguration"
import type { ImportAssignment, ImportDiagnostic, ImportResultFile } from "./types"

const failurePhases = [
  "discover",
  "firstPass",
  "mergeMetadata",
  "secondPass",
  "mergeFiles",
  "copyExternalFiles",
  "hashProject",
  "writeIndex",
] as const

type FailurePhase = (typeof failurePhases)[number]

const assignments: ImportAssignment[] = [assignment("Контрагенты"), assignment("Номенклатура")]
const resultFiles: ImportResultFile[] = [
  {
    sourceKind: "worker",
    sourcePath: "/temp/Свойства.yaml",
    targetProjectPath: "Справочник/Контрагенты/Свойства.yaml",
  },
]
const fragmentData: Pick<ConfigurationIndexData, "identities" | "xmlNodes" | "xmlValues"> = {
  identities: [{ logicalAddress: "Справочник.Контрагенты", kind: "uuid", value: "new-uuid" }],
  xmlNodes: [{ logicalAddress: "Справочник.Контрагенты", present: ["Name"] }],
  xmlValues: [{ logicalAddress: "Справочник.Контрагенты.Name", xmlText: "Контрагенты" }],
}

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((directory) => fs.promises.rm(directory, { recursive: true, force: true }))
  )
})

describe("configuration XML import coordinator", () => {
  it("detects the main configuration and writes it to cf", async () => {
    const calls: string[] = []
    const params = createParams("configuration")
    const writtenIndexes: Array<{ address: ComponentAddress; data: ConfigurationIndexData }> = []
    const initialized: Array<{ outputDir: string; componentKind: string; metadataItemAugmenter?: string }> = []

    const result = await importConfigurationFromXml(
      params,
      fakeDependencies({ calls, writtenIndexes, initialized })
    )

    expect(result).toEqual({
      componentPath: "cf",
      succeeded: assignments.length,
      failed: [],
      warnings: [],
      configurationIndexPath: configurationIndexPath(params.projectDir, { kind: "configuration" }),
    })
    expect(initialized).toEqual([
      {
        outputDir: join(params.projectDir, "cf"),
        componentKind: "configuration",
      },
    ])
    expect(writtenIndexes).toEqual([
      {
        address: { kind: "configuration" },
        data: configurationIndex("cf"),
      },
    ])
  })

  it("detects Расширение_All and writes it to cfe/Расширение_All", async () => {
    const calls: string[] = []
    const params = createParams("configurationExtension")
    createBaseConfiguration(params.projectDir)
    const writtenIndexes: Array<{ address: ComponentAddress; data: ConfigurationIndexData }> = []
    const initialized: Array<{ outputDir: string; componentKind: string; metadataItemAugmenter?: string }> = []
    let secondPassSnapshots: LayeredImportReferenceSnapshot | undefined
    const base = createImportSharedMetadata([
      ownerFacts("Базовый", join(params.projectDir, "cf", "Справочник", "Базовый", "Свойства.yaml")),
    ])
    const dependencies = fakeDependencies({ calls, writtenIndexes, initialized })
    dependencies.buildComponentReferenceSnapshot = async ({ componentDir }) => {
      calls.push("baseMetadata")
      expect(componentDir).toBe(join(params.projectDir, "cf"))
      return base
    }
    const pool = dependencies.createWorkerPool({ concurrency: 1 })
    dependencies.createWorkerPool = () => ({
      ...pool,
      async runSecondPass(snapshots) {
        calls.push("secondPass")
        secondPassSnapshots = snapshots
        return { diagnostics: [], warnings: [], files: resultFiles }
      },
    })

    const result = await importConfigurationFromXml(params, dependencies)

    expect(result).toMatchObject({
      componentPath: "cfe/Расширение_All",
      succeeded: assignments.length,
      failed: [],
      configurationIndexPath: configurationIndexPath(params.projectDir, {
        kind: "configurationExtension",
        name: "Расширение_All",
      }),
    })
    expect(initialized).toEqual([
      {
        outputDir: join(params.projectDir, "cfe", "Расширение_All"),
        componentKind: "configurationExtension",
        metadataItemAugmenter: "configurationExtension",
      },
    ])
    expect(secondPassSnapshots?.base).toBe(base)
    expect(writtenIndexes[0]).toMatchObject({
      address: { kind: "configurationExtension", name: "Расширение_All" },
      data: { binding: { componentPath: "cfe/Расширение_All", indexGeneration: 1n } },
    })
    expect(calls.indexOf("baseMetadata")).toBeLessThan(calls.indexOf("discover"))
  })

  it("accepts only a requested component path matching the detected extension", async () => {
    const matching = createParams("configurationExtension")
    matching.requestedComponentPath = "cfe/Расширение_All"
    createBaseConfiguration(matching.projectDir)

    const matchingResult = await importConfigurationFromXml(
      matching,
      fakeDependencies({ calls: [] })
    )

    expect(matchingResult.failed).toEqual([])

    const mismatching = createParams("configurationExtension")
    mismatching.requestedComponentPath = "cf"
    createBaseConfiguration(mismatching.projectDir)
    const calls: string[] = []

    const mismatchingResult = await importConfigurationFromXml(
      mismatching,
      fakeDependencies({ calls })
    )

    expect(mismatchingResult).toMatchObject({
      componentPath: "cfe/Расширение_All",
      succeeded: 0,
      failed: [expect.objectContaining({ severity: "error", message: expect.stringMatching(/не совпадает/iu) })],
    })
    expect(calls).toEqual([])
  })

  it("rejects an extension without cf before XML discovery", async () => {
    const params = createParams("configurationExtension")
    const calls: string[] = []

    const result = await importConfigurationFromXml(params, fakeDependencies({ calls }))

    expect(result).toMatchObject({
      componentPath: "cfe/Расширение_All",
      succeeded: 0,
      failed: [expect.objectContaining({ severity: "error", message: expect.stringMatching(/базов.*cf/iu) })],
    })
    expect(calls).toEqual([])
    expect(fs.existsSync(join(params.projectDir, "cfe", "Расширение_All"))).toBe(false)
  })

  it.each(["missing", "empty"] as const)("accepts a %s component target", async (targetState) => {
    const params = createParams("configuration")
    if (targetState === "empty") fs.mkdirSync(join(params.projectDir, "cf"), { recursive: true })

    const result = await importConfigurationFromXml(
      params,
      fakeDependencies({ calls: [] })
    )

    expect(result.failed).toEqual([])
  })

  it("rejects a nonempty extension target without deleting it", async () => {
    const params = createParams("configurationExtension")
    createBaseConfiguration(params.projectDir)
    const target = join(params.projectDir, "cfe", "Расширение_All")
    const sentinel = join(target, "Сохранить.txt")
    fs.mkdirSync(target, { recursive: true })
    fs.writeFileSync(sentinel, "не удалять")
    const calls: string[] = []

    const result = await importConfigurationFromXml(params, fakeDependencies({ calls }))

    expect(result).toMatchObject({
      componentPath: "cfe/Расширение_All",
      succeeded: 0,
      failed: [expect.objectContaining({ severity: "error", message: expect.stringMatching(/не пуст/iu) })],
    })
    expect(fs.readFileSync(sentinel, "utf8")).toBe("не удалять")
    expect(calls).toEqual([])
  })

  it("rejects an existing extension snapshot before XML discovery", async () => {
    const params = createParams("configurationExtension")
    createBaseConfiguration(params.projectDir)
    const snapshotPath = configurationIndexPath(params.projectDir, {
      kind: "configurationExtension",
      name: "Расширение_All",
    })
    fs.mkdirSync(join(snapshotPath, ".."), { recursive: true })
    fs.writeFileSync(snapshotPath, "existing snapshot")
    const calls: string[] = []

    const result = await importConfigurationFromXml(params, fakeDependencies({ calls }))

    expect(result).toMatchObject({
      componentPath: "cfe/Расширение_All",
      succeeded: 0,
      failed: [expect.objectContaining({ severity: "error", message: expect.stringMatching(/снимок.*существ/iu) })],
    })
    expect(fs.readFileSync(snapshotPath, "utf8")).toBe("existing snapshot")
    expect(calls).toEqual([])
  })

  it("leaves a YAML file written before an error and does not write a snapshot", async () => {
    const params = createParams("configuration")
    const componentDir = join(params.projectDir, "cf")
    const yamlPath = join(componentDir, "Конфигурация.yaml")
    const calls: string[] = []
    const writtenIndexes: Array<{ address: ComponentAddress; data: ConfigurationIndexData }> = []
    const diagnostic = importError("broken second pass")
    const dependencies = fakeDependencies({ calls, writtenIndexes })
    const pool = dependencies.createWorkerPool({ concurrency: 1 })
    dependencies.createWorkerPool = () => ({
      ...pool,
      async runSecondPass() {
        calls.push("secondPass")
        fs.mkdirSync(componentDir, { recursive: true })
        fs.writeFileSync(yamlPath, "Имя: ЧастичныйРезультат\n")
        return { diagnostics: [diagnostic], warnings: [], files: [] }
      },
    })

    const result = await importConfigurationFromXml(params, dependencies)

    expect(result.failed).toEqual([diagnostic])
    expect(result.configurationIndexPath).toBeUndefined()
    expect(fs.readFileSync(yamlPath, "utf8")).toBe("Имя: ЧастичныйРезультат\n")
    expect(writtenIndexes).toEqual([])
    expect(fs.existsSync(configurationIndexPath(params.projectDir, { kind: "configuration" }))).toBe(false)
  })

  it("writes the snapshot strictly after direct YAML output, copying and hashing", async () => {
    const params = createParams("configuration")
    const calls: string[] = []

    const result = await importConfigurationFromXml(
      params,
      fakeDependencies({ calls })
    )

    expect(calls).toEqual([
      "discover",
      "initialize",
      "firstPass",
      "mergeMetadata",
      "secondPass",
      "mergeFiles",
      "copyExternalFiles",
      "hashProject",
      "writeIndex",
      "closeWorkers",
    ])
    expect(result.configurationIndexPath).toBe(
      configurationIndexPath(params.projectDir, { kind: "configuration" })
    )
  })

  it.each(failurePhases)("does not publish a snapshot path after the %s failure", async (failurePhase) => {
    const params = createParams("configuration")
    const calls: string[] = []
    const yamlPath = join(params.projectDir, "cf", "Конфигурация.yaml")

    const result = await importConfigurationFromXml(
      params,
      fakeDependencies({ calls, failurePhase })
    )

    expect(result).toMatchObject({
      componentPath: "cf",
      succeeded: 0,
      failed: [expect.objectContaining({ severity: "error", message: `${failurePhase} failed` })],
      warnings: [],
    })
    expect(result.configurationIndexPath).toBeUndefined()
    expect(calls.includes("writeIndex")).toBe(failurePhase === "writeIndex")
    expect(calls.at(-1)).toBe("closeWorkers")
    expect(fs.existsSync(yamlPath)).toBe(
      ["mergeFiles", "copyExternalFiles", "hashProject", "writeIndex"].includes(failurePhase)
    )
  })

  it("does not read unrelated XML before a preflight failure", async () => {
    const params = createParams("configurationExtension")
    createBaseConfiguration(params.projectDir)
    const target = join(params.projectDir, "cfe", "Расширение_All")
    fs.mkdirSync(target, { recursive: true })
    fs.writeFileSync(join(target, "existing.yaml"), "")
    fs.mkdirSync(join(params.inputDir, "Catalogs"), { recursive: true })
    fs.writeFileSync(join(params.inputDir, "Catalogs", "Broken.xml"), "<broken")
    const calls: string[] = []

    const result = await importConfigurationFromXml(params, fakeDependencies({ calls }))

    expect(result.failed).toEqual([
      expect.objectContaining({ message: expect.stringMatching(/не пуст/iu) }),
    ])
    expect(calls).toEqual([])
  })

  it("returns a diagnostic for an unknown Configuration.xml root", async () => {
    const params = createParams("unknown")
    const calls: string[] = []

    const result = await importConfigurationFromXml(params, fakeDependencies({ calls }))

    expect(result).toEqual({
      succeeded: 0,
      failed: [
        expect.objectContaining({
          severity: "error",
          code: "xml_import_operation_failed",
          message: expect.stringMatching(/не найдено.*XML-компонента/iu),
        }),
      ],
      warnings: [],
    })
    expect(calls).toEqual([])
  })

  it("preserves second-pass warnings when its diagnostics contain errors", async () => {
    const params = createParams("configuration")
    const calls: string[] = []
    const diagnostic = importError("broken second pass")
    const warning: ImportDiagnostic = {
      severity: "warning",
      code: "unresolved_data_path",
      message: "unresolved",
      targetProjectPath: "Справочник/Контрагенты/Формы/ФормаЭлемента/Форма.yaml",
    }
    const dependencies = fakeDependencies({ calls })
    const pool = dependencies.createWorkerPool({ concurrency: 1 })
    dependencies.createWorkerPool = () => ({
      ...pool,
      async runSecondPass() {
        calls.push("secondPass")
        return { diagnostics: [diagnostic], warnings: [warning], files: [] }
      },
    })

    const result = await importConfigurationFromXml(params, dependencies)

    expect(result.failed).toEqual([diagnostic])
    expect(result.warnings).toEqual([warning])
  })

  it("emits import profile records for main coordinator steps", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const previous = process.env["NKDK_PROFILE"]
    let lines: string[] = []
    process.env["NKDK_PROFILE"] = "1"
    try {
      await importConfigurationFromXml(
        createParams("configuration"),
        fakeDependencies({ calls: [] })
      )
      lines = error.mock.calls.map(([line]) => String(line))
    } finally {
      if (previous === undefined) delete process.env["NKDK_PROFILE"]
      else process.env["NKDK_PROFILE"] = previous
      error.mockRestore()
    }

    expect(
      lines.some(
        (line) =>
          line.includes("[nkdk-profile-step]") &&
          line.includes('operation="import-from-xml"') &&
          line.includes('substep="Поиск XML-файлов выгрузки"')
      )
    ).toBe(true)
    expect(
      lines.some(
        (line) =>
          line.includes("[nkdk-profile-step]") &&
          line.includes('substep="Копирование внешних файлов XML-выгрузки"')
      )
    ).toBe(true)
    expect(lines.some((line) => line.includes('substep="Перенос результата импорта в проект"'))).toBe(false)
  })
})

function createParams(
  kind: "configuration" | "configurationExtension" | "unknown"
): ImportConfigurationFromXmlParams {
  const projectDir = temporaryDirectory("nkdk-import-project-")
  const inputDir = temporaryDirectory("nkdk-import-xml-")
  fs.writeFileSync(
    join(inputDir, "Configuration.xml"),
    kind === "configuration"
      ? configurationXml()
      : kind === "configurationExtension"
        ? configurationExtensionXml()
        : "<MetaDataObject><Unknown/></MetaDataObject>"
  )
  return {
    context: mockContextFromXML(),
    inputDir,
    projectDir,
    concurrency: 2,
    operationId: "task-6",
  }
}

function fakeDependencies(params: {
  calls: string[]
  failurePhase?: FailurePhase
  writtenIndexes?: Array<{ address: ComponentAddress; data: ConfigurationIndexData }>
  initialized?: Array<{ outputDir: string; componentKind: string; metadataItemAugmenter?: string }>
}): ImportCoordinatorDependencies {
  let componentDir: string | undefined
  const call = (phase: FailurePhase): void => {
    params.calls.push(phase)
    if (params.failurePhase === phase) throw new Error(`${phase} failed`)
  }

  return {
    createWorkerPool() {
      return {
        async initialize(initializeParams) {
          params.calls.push("initialize")
          componentDir = initializeParams.outputDir
          params.initialized?.push({
            outputDir: initializeParams.outputDir,
            componentKind: initializeParams.componentKind,
            ...(
              initializeParams.metadataItemAugmenter === undefined
                ? {}
                : { metadataItemAugmenter: initializeParams.metadataItemAugmenter }
            ),
          })
        },
        async runFirstPass() {
          call("firstPass")
          return { diagnostics: [], ownerFacts: [], fragmentData }
        },
        async runSecondPass() {
          call("secondPass")
          if (componentDir === undefined) throw new Error("Worker pool не инициализирован")
          fs.mkdirSync(componentDir, { recursive: true })
          fs.writeFileSync(join(componentDir, "Конфигурация.yaml"), "Имя: Конфигурация\n")
          return { diagnostics: [], warnings: [], files: resultFiles }
        },
        async close() {
          params.calls.push("closeWorkers")
        },
      }
    },
    async discover() {
      call("discover")
      return { assignments }
    },
    createSharedMetadata() {
      call("mergeMetadata")
      return createImportSharedMetadata([])
    },
    async buildComponentReferenceSnapshot() {
      return createImportSharedMetadata([])
    },
    mergeFiles(files) {
      call("mergeFiles")
      return [...files]
    },
    async copyExternalFiles() {
      call("copyExternalFiles")
    },
    async hashProject(_projectDir, projectPaths) {
      call("hashProject")
      expect(projectPaths).toEqual(resultFiles.map((file) => file.targetProjectPath))
      return [{ projectPath: "Конфигурация.yaml", contentHash: 42n }]
    },
    async writeIndex({ address, data }) {
      call("writeIndex")
      params.writtenIndexes?.push({ address, data })
    },
  }
}

function temporaryDirectory(prefix: string): string {
  const directory = fs.mkdtempSync(join(os.tmpdir(), prefix))
  tempDirs.push(directory)
  return directory
}

function createBaseConfiguration(projectDir: string): void {
  fs.mkdirSync(join(projectDir, "cf"), { recursive: true })
}

function configurationXml(): string {
  return `
<MetaDataObject>
  <Configuration>
    <Properties>
      <Name>Основная</Name>
    </Properties>
  </Configuration>
</MetaDataObject>
`
}

function configurationExtensionXml(): string {
  return `
<MetaDataObject>
  <Configuration>
    <Properties>
      <Name>Расширение_All</Name>
      <ConfigurationExtensionPurpose>Customization</ConfigurationExtensionPurpose>
    </Properties>
  </Configuration>
</MetaDataObject>
`
}

function assignment(name: string): ImportAssignment {
  return {
    id: `Справочник/${name}/Свойства.yaml`,
    role: "properties",
    targetProjectPath: `Справочник/${name}/Свойства.yaml`,
    itemType: "MetadataCatalog",
    itemName: name,
    logicalAddress: `Справочник.${name}`,
    owner: undefined,
    xmlFiles: [{ role: "metadata", sourcePath: `/xml/Catalogs/${name}.xml` }],
    externalFiles: [],
  }
}

function importError(message: string): ImportDiagnostic {
  return {
    severity: "error",
    code: "xml_import_assignment_failed",
    message,
    targetProjectPath: "Справочник/Контрагенты/Свойства.yaml",
  }
}

function configurationIndex(component: string): ConfigurationIndexData {
  return {
    binding: {
      indexGeneration: 1n,
      producerVersion: "0.0.0-dev",
      componentPath: component,
      baseFingerprint: new Uint8Array(),
      configurationVersion: new Uint8Array(),
    },
    projectFiles: [{ projectPath: "Конфигурация.yaml", contentHash: 42n }],
    ...fragmentData,
  }
}

function ownerFacts(name: string, filePath: string): ValidationOwnerFacts {
  return {
    ref: { kind: "Справочник", name },
    filePath,
    fieldIndex: {
      fields: new Map(),
      standardAttributeAliases: new Map(),
      diagnostics: [],
    },
  }
}
