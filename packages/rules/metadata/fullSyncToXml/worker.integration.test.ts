import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { decodeConfigurationBlockFragments } from "@nkdk/runtime"
import { hashFileBytes } from "@nkdk/runtime"
import { childSegmentUid, childUid } from "@nkdk/runtime"
import {
  type ConfigurationIndexBlockFragment,
  type ConfigurationProjectFile,
  type ConfigurationIndexStoreDescriptor,
} from "@nkdk/runtime"
import {
  createConfigurationIndexCandidateStore,
  openConfigurationIndexStore,
} from "@nkdk/runtime/configuration-index-store"
import type { ConfigurationContext } from "@nkdk/runtime"
import type { ProjectStateReadSession, ProjectStateReadToken } from "../projectState"
import { createTestProjectStateReadToken } from "../projectState/tests/readToken"
import {
  createFullXmlSyncCompositionReader,
  createFullXmlSyncCompositionSnapshot,
} from "./sharedMetadata"
import { fullXmlSyncTestTopologyFields } from "./testTopology"
import type {
  FullXmlSyncAssignment,
  FullXmlSyncExecutionAssignment,
  FullXmlSyncOutputTarget,
} from "./types"
import type { FullXmlSyncWorkerProfileRuntime } from "./componentProfile"
import { emptyProjectStateReadSession } from "./testHelpers"
import { openFullXmlSyncBinaryResult } from "./binaryResult"
import {
  createFullXmlSyncWorkerCommandRunner,
} from "./worker"
import { configurationFullXmlSyncProfile } from "./profiles/configuration"
import type { ConfirmedComponentState } from "../project/componentState/types"

const fullSyncWorker = createFullXmlSyncWorkerCommandRunner()
const runFullXmlSyncWorkerCommand = fullSyncWorker.run
const fullXmlSyncWorkerStateForTests = fullSyncWorker.stateForTests
const resetFullXmlSyncWorkerStateForTests = fullSyncWorker.resetForTests
const baseFormModes = ["saved", "projected", "own"] as const
type BaseFormMode = (typeof baseFormModes)[number]

interface BaseFormFixture {
  mode: BaseFormMode
  adopted: boolean
  projectDir: string
  componentDir: string
  baseComponentDir: string
  projectPath: string
  sourcePath: string
  baseSourcePath: string
  savedProjectPath: string
  savedSourcePath: string
  logicalAddress: string
  assigned: FullXmlSyncExecutionAssignment
  baseDescriptor: ConfigurationIndexStoreDescriptor
  targetDescriptor: ConfigurationIndexStoreDescriptor
}

describe("full XML sync worker", () => {
  const tempDirs: string[] = []
  const persistentDirs: string[] = []
  let sharedEmptyIndexDir: string
  let sharedEmptyIndexDescriptor: ConfigurationIndexStoreDescriptor
  let oldXmlStateFixture: {
    projectDir: string
    assigned: FullXmlSyncExecutionAssignment
    targetSnapshot: TestIndex
    targetDescriptor: ConfigurationIndexStoreDescriptor
    profile: FullXmlSyncWorkerProfileRuntime
  }
  let partialRoundTripFixture: {
    projectDir: string
    assigned: FullXmlSyncExecutionAssignment
    declarationId: string
    descriptor: ConfigurationIndexStoreDescriptor
  }
  const baseFormFixtures = new Map<BaseFormMode, BaseFormFixture>()
  const context = {
    version: "2.20",
    languages: { default: "ru", registered: ["ru"], registeredSet: new Set(["ru"]), version: '["ru",["ru"]]' },
    exportToYAML: { toTyped: false },
  } as const
  const readToken = createTestProjectStateReadToken()

  beforeAll(async () => {
    sharedEmptyIndexDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-full-sync-empty-index-"))
    sharedEmptyIndexDescriptor = await installTestIndex(
      sharedEmptyIndexDir,
      { kind: "configuration" },
      emptyTestIndex(),
    )

    const oldProjectDir = createPersistentProject(["Товары"])
    const baseAssignment = assignment(oldProjectDir, "Товары")
    const targetSnapshot: TestIndex = {
      files: [{ projectPath: baseAssignment.sourceProjectPath, contentHash: baseAssignment.expectedContentHash }],
      fragments: [{ targetProjectPath: baseAssignment.sourceProjectPath, entities: [{
        logicalAddress: baseAssignment.logicalAddress,
        uuid: "00000000-0000-4000-8000-000000000001",
      }]}],
    }
    const assigned: FullXmlSyncExecutionAssignment = {
      ...baseAssignment,
      configurationIndexSources: { targetProjectPaths: [baseAssignment.sourceProjectPath], baseProjectPaths: [] },
    }
    const targetDescriptor = await installTestIndex(oldProjectDir, { kind: "configuration" }, targetSnapshot)
    const profile = (await configurationFullXmlSyncProfile.confirm({
      target: configurationState(oldProjectDir, assigned, targetDescriptor),
    })).workerProfile
    oldXmlStateFixture = { projectDir: oldProjectDir, assigned, targetSnapshot, targetDescriptor, profile }

    const partialProjectDir = createPersistentProject(["Товары"])
    const partialAssignment = assignment(partialProjectDir, "Товары")
    partialRoundTripFixture = {
      projectDir: partialProjectDir,
      assigned: partialAssignment,
      declarationId: partialAssignment.potentialOutputs[0]!.declarationId,
      descriptor: await installTestIndex(
        partialProjectDir,
        { kind: "configuration" },
        targetIndexForAssignment(partialAssignment),
      ),
    }
    for (const mode of baseFormModes) baseFormFixtures.set(mode, await prepareBaseFormFixture(mode))
  })

  afterAll(() => {
    fs.rmSync(sharedEmptyIndexDir, { recursive: true, force: true })
    for (const dir of persistentDirs) fs.rmSync(dir, { recursive: true, force: true })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    resetFullXmlSyncWorkerStateForTests()
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it("prepares and writes every assignment without retaining its YAML or XML", async () => {
    const projectDir = createProject(["Товары"])
    const assigned = assignment(projectDir, "Товары")
    await initialize(projectDir, [assigned])

    const result = await runFullXmlSyncWorkerCommand({
      kind: "execute",
      assignments: [assigned],
    })

    expect(result).toMatchObject({
      kind: "executionResult",
      diagnostics: [],
      warnings: [],
      writtenFiles: [{ targetXmlPath: "Catalogs/Товары.xml" }],
    })
    expect(fs.existsSync(join(projectDir, ".out", "Catalogs", "Товары.xml"))).toBe(true)
    expect(fullXmlSyncWorkerStateForTests()).toMatchObject({
      initialized: true,
      componentDir: projectDir,
      importProjectDir: projectDir,
    })
    expect(fullXmlSyncWorkerStateForTests()).not.toHaveProperty("activeAssignmentId")
    expect(fullXmlSyncWorkerStateForTests()).not.toHaveProperty("preparedIds")
    expect(fullXmlSyncWorkerStateForTests()).not.toHaveProperty("baseIndexSnapshot")
  })

  it.each([
    [undefined, "cfg:AnyIBRef"],
    [{ AnyIBRef: "AnyRef" }, "cfg:AnyRef"],
  ] as const)("passes the TypeDescription XML name policy to assignment export", async (policy, expected) => {
    const projectDir = createProject(["Товары"])
    fs.writeFileSync(
      join(projectDir, "Справочник", "Товары", "Свойства.yaml"),
      "Имя: Товары\nРеквизиты:\n  СсылкаНаОбъект:\n    Тип: ЛюбаяСсылка\n"
    )
    const assigned = assignment(projectDir, "Товары")
    await initialize(projectDir, [assigned], context, undefined, undefined, undefined, undefined, undefined, policy)

    const result = await runFullXmlSyncWorkerCommand({ kind: "execute", assignments: [assigned] })

    expect(result).toMatchObject({ kind: "executionResult", diagnostics: [] })
    const xml = fs.readFileSync(join(projectDir, ".out", "Catalogs", "Товары.xml"), "utf8")
    expect(xml).toContain(`<v8:TypeSet>${expected}</v8:TypeSet>`)
  })

  it("не переносит обычное XML-состояние старого снимка при полном sync конфигурации", async () => {
    const { projectDir, assigned, targetSnapshot, targetDescriptor, profile } = oldXmlStateFixture
    await initialize(
      projectDir,
      [assigned],
      context,
      undefined,
      undefined,
      undefined,
      targetSnapshot,
      undefined,
      undefined,
      profile,
      targetDescriptor,
    )

    const result = await runFullXmlSyncWorkerCommand({ kind: "execute", assignments: [assigned] })

    expect(result).toMatchObject({ kind: "executionResult", diagnostics: [] })
    if (result?.kind !== "executionResult") throw new Error("unexpected result")
    const xml = fs.readFileSync(join(projectDir, ".out", "Catalogs", "Товары.xml"), "utf8")
    expect(xml).toContain('uuid="00000000-0000-4000-8000-000000000001"')
    expect(xml).not.toContain("Устаревший комментарий")
    expect(JSON.stringify(decodeConfigurationBlockFragments(result.fragmentBuffer))).not.toContain("xmlText")
  })

  it("возвращает каждую рабочую пачку двоичным результатом и ничего не накапливает к завершению", async () => {
    const projectDir = createProject(["Товары"])
    const assigned = assignment(projectDir, "Товары")
    await initialize(projectDir, [assigned])

    const batch = openFullXmlSyncBinaryResult(await runFullXmlSyncWorkerCommand({
      kind: "executeBatch",
      assignments: [assigned],
    }))

    expect(batch.writtenFiles.file(0)).toMatchObject({ targetXmlPath: "Catalogs/Товары.xml" })
    expect(JSON.stringify(decodeConfigurationBlockFragments(batch.fragmentBuffer))).not.toMatch(
      /"xmlName"|"present"|"xsiNil"|"explicitEmpty"|"xsiType"|"xmlText"|"xmlPrefix"/u,
    )
    expect(await runFullXmlSyncWorkerCommand({ kind: "finishExecution" })).toBeUndefined()
  })

  it("возвращает запрошенный XML точными UTF-8 байтами без записи файлов", async () => {
    const projectDir = createProject(["Товары"])
    const assigned = assignment(projectDir, "Товары")
    const declarationId = assigned.potentialOutputs[0]!.declarationId
    await initialize(projectDir, [assigned], context, undefined, undefined, undefined, undefined, {
      kind: "memory",
      documentIdsByAssignment: { [assigned.id]: [declarationId] },
    })

    const batch = openFullXmlSyncBinaryResult(await runFullXmlSyncWorkerCommand({
      kind: "executeBatch",
      assignments: [assigned],
    }))

    expect(batch.writtenFiles.count).toBe(0)
    expect(batch.generatedDocuments.count).toBe(1)
    const document = batch.generatedDocuments.document(0)
    expect(document).toMatchObject({
      assignmentId: assigned.id,
      declarationId,
      targetXmlPath: "Catalogs/Товары.xml",
    })
    const xml = new TextDecoder("utf-8", { fatal: true }).decode(document.content)
    expect(document.content).toEqual(Uint8Array.from([0xef, 0xbb, 0xbf, ...new TextEncoder().encode(xml)]))
    expect(xml).toContain("<Name>Товары</Name>")
    expect(fs.existsSync(join(projectDir, ".out"))).toBe(false)
  })

  it("восстанавливает те же XML-байты из блока, опубликованного частичной синхронизацией", async () => {
    const { projectDir, assigned, declarationId, descriptor } = partialRoundTripFixture
    const outputTarget: FullXmlSyncOutputTarget = {
      kind: "memory",
      documentIdsByAssignment: { [assigned.id]: [declarationId] },
    }
    const initializeFromPublishedIndex = async (operationSeed: Uint8Array) => {
      await runFullXmlSyncWorkerCommand({
        kind: "initialize",
        workerIndex: 0,
        componentPath: "cf",
        componentDir: projectDir,
        outputTarget,
        context,
        profile: { kind: "configuration", componentKind: "configuration", adoptedUuids: {} },
        composition: createFullXmlSyncCompositionSnapshot([assigned]),
        targetIndex: descriptor,
        operationSeed,
        projectStateReadToken: readToken,
      }, { openReadSession: () => emptyReadSession() })
    }

    await initializeFromPublishedIndex(new Uint8Array(32))
    const partial = openFullXmlSyncBinaryResult(await runFullXmlSyncWorkerCommand({
      kind: "executeBatch",
      assignments: [assigned],
    }))
    const partialBytes = partial.generatedDocuments.document(0).content
    const [fragment] = decodeConfigurationBlockFragments(partial.fragmentBuffer)
    if (fragment === undefined) throw new Error("частичная синхронизация не вернула блок снимка")
    await runFullXmlSyncWorkerCommand({ kind: "dispose" })

    const active = openConfigurationIndexStore(descriptor, "readWrite")
    try {
      await active.writePending({
        hashes: new Map(),
        blocks: new Map([[fragment.targetProjectPath, {
          kind: "put",
          block: { entities: fragment.entities },
        }]]),
      })
      await active.applyPending()
      await active.clearPending()
    } finally {
      await active.close()
    }

    await initializeFromPublishedIndex(new Uint8Array(32).fill(1))
    const full = openFullXmlSyncBinaryResult(await runFullXmlSyncWorkerCommand({
      kind: "executeBatch",
      assignments: [assigned],
    }))
    await runFullXmlSyncWorkerCommand({ kind: "dispose" })

    expect(full.generatedDocuments.document(0).content).toEqual(partialBytes)
  })

  it("сообщает об отсутствующем запрошенном XML-документе", async () => {
    const projectDir = createProject(["Товары"])
    const assigned = assignment(projectDir, "Товары")
    await initialize(projectDir, [assigned], context, undefined, undefined, undefined, undefined, {
      kind: "memory",
      documentIdsByAssignment: { [assigned.id]: ["missing-document"] },
    })

    const batch = openFullXmlSyncBinaryResult(await runFullXmlSyncWorkerCommand({
      kind: "executeBatch",
      assignments: [assigned],
    }))

    expect(batch.generatedDocuments.count).toBe(0)
    expect(batch.diagnostics.diagnostic(0)).toMatchObject({
      code: "full_xml_sync_assignment_failed",
      assignmentId: assigned.id,
      message: expect.stringContaining("missing-document"),
    })
  })

  it("строит каталог типов один раз при initialize и переиспользует между пачками", async () => {
    const projectDir = createProject(["Первый", "Второй"])
    const assignments = [assignment(projectDir, "Первый"), assignment(projectDir, "Второй")]
    const composition = createFullXmlSyncCompositionSnapshot(assignments)
    let catalogBuilds = 0
    const targetDescriptor = await installTestIndex(
      projectDir,
      { kind: "configuration" },
      emptyTestIndex(),
    )

    await runFullXmlSyncWorkerCommand({
      kind: "initialize",
      workerIndex: 0,
      componentPath: "cf",
      componentDir: projectDir,
      outputTarget: { kind: "directory", outputDir: join(projectDir, ".out") },
      context,
      profile: { kind: "configuration", componentKind: "configuration", adoptedUuids: {} },
      composition,
      targetIndex: targetDescriptor,
      operationSeed: new Uint8Array(32),
      projectStateReadToken: readToken,
    }, {
      openReadSession: () => emptyReadSession(),
      createCompositionReader(snapshot) {
        const reader = createFullXmlSyncCompositionReader(snapshot)
        return {
          ...reader,
          itemTypeByYamlDir() {
            catalogBuilds += 1
            return reader.itemTypeByYamlDir()
          },
        }
      },
    })

    await runFullXmlSyncWorkerCommand({ kind: "executeBatch", assignments: [assignments[0]!] })
    await runFullXmlSyncWorkerCommand({ kind: "executeBatch", assignments: [assignments[1]!] })

    expect(catalogBuilds).toBe(1)
  })

  it("освобождает локальный reader назначения после обработки", async () => {
    vi.stubEnv("NKDK_PROFILE", "1")
    const profileOutput = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const projectDir = createProject(["Товары"])
    const baseAssignment = assignment(projectDir, "Товары")
    const targetSnapshot = targetIndexForAssignment(baseAssignment)
    const assigned: FullXmlSyncExecutionAssignment = {
      ...baseAssignment,
      configurationIndexSources: { targetProjectPaths: [baseAssignment.sourceProjectPath], baseProjectPaths: [] },
    }
    await initialize(projectDir, [assigned], context, undefined, undefined, undefined, targetSnapshot)

    await runFullXmlSyncWorkerCommand({ kind: "executeBatch", assignments: [assigned] })
    await runFullXmlSyncWorkerCommand({ kind: "finishExecution" })

    const output = profileOutput.mock.calls.flat().join("\n")
    expect(output).not.toContain("Глобальные fallback")
    expect(fullXmlSyncWorkerStateForTests()).not.toHaveProperty("assignmentIndex")
  })

  it("keeps an already written XML and stops when the next YAML hash changed", async () => {
    const projectDir = createProject(["Первый", "Второй"])
    const assignments = [assignment(projectDir, "Первый"), assignment(projectDir, "Второй")]
    await initialize(projectDir, assignments)
    fs.writeFileSync(assignments[1]!.sourcePath, "Имя: Изменён\n")

    const result = await runFullXmlSyncWorkerCommand({
      kind: "execute",
      assignments,
    })

    expect(result?.kind).toBe("executionResult")
    if (result?.kind !== "executionResult") throw new Error("unexpected result")
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "full_xml_sync_source_changed",
        sourceProjectPath: assignments[1]!.sourceProjectPath,
      })
    )
    expect(fs.existsSync(join(projectDir, ".out", "Catalogs", "Первый.xml"))).toBe(true)
    expect(fs.existsSync(join(projectDir, ".out", "Catalogs", "Второй.xml"))).toBe(false)
    expect(fullXmlSyncWorkerStateForTests()).not.toHaveProperty("activeAssignmentId")
  })

  it("releases all state on dispose", async () => {
    const projectDir = createProject(["Товары"])
    const assigned = assignment(projectDir, "Товары")
    const baseSnapshot = emptyTestIndex()
    await initialize(projectDir, [assigned], context, baseSnapshot)

    expect(fullXmlSyncWorkerStateForTests().baseIndexPath).toMatch(/\.lmdb$/u)

    await runFullXmlSyncWorkerCommand({ kind: "dispose" })

    expect(fullXmlSyncWorkerStateForTests()).toEqual({ initialized: false })
  })

  it("opens one neutral project-state session, batches assignment owners, and closes it on dispose", async () => {
    const projectDir = createProject(["Первый", "Второй"])
    const assignments = [assignment(projectDir, "Первый"), assignment(projectDir, "Второй")]
    const batches: readonly string[][] = []
    let closed = false
    const session = emptyReadSession({
      readDependencyOwnerInputs(requests) {
        ;(batches as string[][]).push(requests.map(({ owner }) => `${owner.kind}.${owner.name}`))
        return requests.map(({ requestId }) => ({ requestId, status: "missing" as const }))
      },
      close() { closed = true },
    })

    await initialize(projectDir, assignments, context, undefined, () => session)
    await runFullXmlSyncWorkerCommand({ kind: "execute", assignments })
    await runFullXmlSyncWorkerCommand({ kind: "dispose" })

    expect(batches).toEqual([["Справочник.Первый", "Справочник.Второй"]])
    expect(closed).toBe(true)
  })

  it("preloads a flat assignment owner by its semantic name", async () => {
    const projectDir = createProject([])
    const dir = join(projectDir, "ПараметрСеанса")
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(join(dir, "ТекущийПользователь.yaml"), "Имя: ТекущийПользователь\n")
    const assigned = flatSessionParameterAssignment(projectDir, "ТекущийПользователь")
    const batches: string[][] = []
    const session = emptyReadSession({
      readDependencyOwnerInputs(requests) {
        batches.push(requests.map(({ owner }) => `${owner.kind}.${owner.name}`))
        return requests.map(({ requestId }) => ({ requestId, status: "missing" as const }))
      },
    })

    await initialize(projectDir, [assigned], context, undefined, () => session)
    await runFullXmlSyncWorkerCommand({ kind: "execute", assignments: [assigned] })

    expect(batches).toEqual([["ПараметрСеанса.ТекущийПользователь"]])
  })

  it("использует установленную сессию универсальной линии и не закрывает её", async () => {
    const projectDir = createProject(["Товары"])
    const assigned = assignment(projectDir, "Товары")
    let closed = false
    const session = emptyReadSession({ close() { closed = true } })

    await initialize(
      projectDir,
      [assigned],
      context,
      undefined,
      () => { throw new Error("Не должна открываться отдельная сессия") },
      session,
    )
    await runFullXmlSyncWorkerCommand({ kind: "dispose" })

    expect(closed).toBe(false)
  })

  it("does not open a session when initialize rejects an invalid index descriptor", async () => {
    const projectDir = createProject(["Товары"])
    const assigned = assignment(projectDir, "Товары")
    let closeCalls = 0

    await expect(initialize(
      projectDir,
      [assigned],
      context,
      undefined,
      () => emptyReadSession({ close() { closeCalls += 1 } }),
      undefined,
      {} as never,
    )).rejects.toBeInstanceOf(Error)

    expect(closeCalls).toBe(0)
    expect(fullXmlSyncWorkerStateForTests()).toEqual({ initialized: false })
  })

  it("closes the session once after a preload failure", async () => {
    const projectDir = createProject(["Товары"])
    const assigned = assignment(projectDir, "Товары")
    let closeCalls = 0
    await initialize(projectDir, [assigned], context, undefined, () => emptyReadSession({
      readDependencyOwnerInputs() { throw new Error("ошибка preload") },
      close() { closeCalls += 1 },
    }))

    await expect(runFullXmlSyncWorkerCommand({ kind: "execute", assignments: [assigned] }))
      .rejects.toThrow("ошибка preload")
    await runFullXmlSyncWorkerCommand({ kind: "dispose" })
    await runFullXmlSyncWorkerCommand({ kind: "dispose" })

    expect(closeCalls).toBe(1)
    expect(fullXmlSyncWorkerStateForTests()).toEqual({ initialized: false })
  })

  it("releases state once even when session close fails", async () => {
    const projectDir = createProject(["Товары"])
    const assigned = assignment(projectDir, "Товары")
    let closeCalls = 0
    await initialize(projectDir, [assigned], context, undefined, () => emptyReadSession({
      close() {
        closeCalls += 1
        throw new Error("ошибка close")
      },
    }))

    await expect(runFullXmlSyncWorkerCommand({ kind: "dispose" })).rejects.toThrow("ошибка close")
    await expect(runFullXmlSyncWorkerCommand({ kind: "dispose" })).resolves.toBeUndefined()

    expect(closeCalls).toBe(1)
    expect(fullXmlSyncWorkerStateForTests()).toEqual({ initialized: false })
  })

  it("does not let caller context override the confirmed component profile", async () => {
    const projectDir = createProject(["Товары"])
    const assigned = assignment(projectDir, "Товары")
    await initialize(projectDir, [assigned], {
      ...context,
      exportToXML: {
        version: context.version,
        itemsTree: [],
        componentKind: "configurationExtension",
        adoptedUuids: {
          [assigned.logicalAddress]: "11111111-1111-4111-8111-111111111111",
        },
        context: {
          forms: [],
          templates: [],
          parentName: "",
          metadataForNumbering: [],
        },
      },
    })

    const result = await runFullXmlSyncWorkerCommand({
      kind: "execute",
      assignments: [assigned],
    })

    expect(result).toMatchObject({ kind: "executionResult", diagnostics: [] })
    const xml = fs.readFileSync(join(projectDir, ".out", "Catalogs", "Товары.xml"), "utf8")
    expect(xml).not.toContain("<ObjectBelonging>Adopted</ObjectBelonging>")
    expect(xml).not.toContain("<ExtendedConfigurationObject>")
  })

  it.each(baseFormModes)("строит BaseForm заимствованной общей формы в режиме %s", async (mode) => {
      const fixture = baseFormFixtures.get(mode)
      if (fixture === undefined) throw new Error(`Не подготовлен режим ${mode}`)
      const { adopted, projectDir, componentDir, baseComponentDir, projectPath, sourcePath, baseSourcePath,
        savedProjectPath, savedSourcePath, logicalAddress, assigned, baseDescriptor, targetDescriptor } = fixture
      await runFullXmlSyncWorkerCommand({
        kind: "initialize",
        workerIndex: 0,
        componentPath: "cfe/Продажи",
        componentDir,
        outputTarget: { kind: "directory", outputDir: join(projectDir, ".out") },
        context,
        profile: {
          kind: "configurationExtension",
          componentKind: "configurationExtension",
          adoptedUuids: adopted
            ? {
                [logicalAddress]: "11111111-1111-4111-8111-111111111111",
              }
            : {},
          baseForms: {
            componentDir: baseComponentDir,
            projectFiles: [
              {
                projectPath,
                contentHash: hashFileBytes(fs.readFileSync(baseSourcePath)),
              },
            ],
            targetProjectFiles: [
              { projectPath, contentHash: hashFileBytes(fs.readFileSync(sourcePath)) },
              ...(mode === "saved"
                ? [{ projectPath: savedProjectPath, contentHash: hashFileBytes(fs.readFileSync(savedSourcePath)) }]
                : []),
            ],
            snapshot: baseDescriptor,
          },
        },
        composition: createFullXmlSyncCompositionSnapshot([assigned]),
        targetIndex: targetDescriptor,
        baseIndex: baseDescriptor,
        operationSeed: new Uint8Array(32),
        projectStateReadToken: readToken,
      }, { openReadSession: () => emptyReadSession() })
      expect(fullXmlSyncWorkerStateForTests().baseIndexPath).toBe(baseDescriptor.dataPath)

      const result = await runFullXmlSyncWorkerCommand({
        kind: "execute",
        assignments: [assigned],
      })

      expect(result).toMatchObject({
        kind: "executionResult",
        diagnostics: [],
      })
      const formXml = fs.readFileSync(join(projectDir, ".out", "CommonForms", "ФормаПродаж", "Ext", "Form.xml"), "utf8")
      expect(fs.existsSync(savedSourcePath)).toBe(mode === "saved")
      if (adopted) {
        expect(formXml).toContain("<BaseForm")
        expect(formXml).toContain(`<Width>${mode === "saved" ? 70 : 80}</Width>`)
        const baseFormXml = formXml.slice(
          formXml.indexOf("<BaseForm"),
          formXml.indexOf("</BaseForm>") + "</BaseForm>".length
        )
        if (mode === "saved") {
          expect(baseFormXml).toContain('name="ИсторическоеПоле"')
          expect(baseFormXml).not.toContain('name="Поле"')
        } else {
          expect(baseFormXml).toContain('name="Поле" id="10"')
          expect(baseFormXml).not.toContain('id="1000010"')
        }
      } else {
        expect(formXml).not.toContain("<BaseForm")
      }
  })

  async function prepareBaseFormFixture(mode: BaseFormMode): Promise<BaseFormFixture> {
    const adopted = mode !== "own"
    const projectDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-full-sync-common-form-"))
    persistentDirs.push(projectDir)
    const componentDir = join(projectDir, "cfe", "Расширение")
    const baseComponentDir = join(projectDir, "cf")
    const projectPath = "ОбщаяФорма/ФормаПродаж/Свойства.yaml"
    const sourcePath = join(componentDir, ...projectPath.split("/"))
    const baseSourcePath = join(baseComponentDir, ...projectPath.split("/"))
    const savedProjectPath = "ОбщаяФорма/ФормаПродаж/БазоваяФорма.yaml"
    const savedSourcePath = join(componentDir, ...savedProjectPath.split("/"))
    fs.mkdirSync(join(sourcePath, ".."), { recursive: true })
    fs.mkdirSync(join(baseSourcePath, ".."), { recursive: true })
    fs.writeFileSync(
      sourcePath,
      ["Имя: ФормаПродаж", "Форма:", "  Ширина: 100", "  Элементы:", "    Поле:", "      Вид: ПолеВвода", ""].join("\n"),
    )
    fs.writeFileSync(
      baseSourcePath,
      ["Имя: ФормаПродаж", "Форма:", "  Ширина: 80", "  Элементы:", "    Поле:", "      Вид: ПолеВвода", ""].join("\n"),
    )
    if (mode === "saved") {
      fs.writeFileSync(
        savedSourcePath,
        ["Ширина: 70", "Элементы:", "  ИсторическоеПоле:", "    Вид: ПолеВвода", ""].join("\n"),
      )
    }
    const logicalAddress = "ОбщаяФорма.ФормаПродаж"
    const elementAddress = childUid(logicalAddress, "Элемент", "Поле")
    const baseSnapshot: TestIndex = {
      files: [{ projectPath, contentHash: hashFileBytes(fs.readFileSync(baseSourcePath)) }],
      fragments: [{ targetProjectPath: projectPath, entities: [
        { logicalAddress: childUid(logicalAddress, "Элемент", "ФормаКоманднаяПанель"), xmlId: "9" },
        { logicalAddress: elementAddress, xmlId: "10" },
        { logicalAddress: childSegmentUid(elementAddress, "КонтекстноеМеню"), xmlId: "11" },
        { logicalAddress: childSegmentUid(elementAddress, "РасширеннаяПодсказка"), xmlId: "12" },
      ]}],
    }
    const assigned: FullXmlSyncExecutionAssignment = {
      id: projectPath,
      sourceProjectPath: projectPath,
      sourcePath,
      expectedContentHash: hashFileBytes(fs.readFileSync(sourcePath)),
      role: "properties",
      itemType: "MetadataCommonForm",
      itemName: "ФормаПродаж",
      logicalAddress,
      configurationIndexSources: {
        targetProjectPaths: [projectPath, ...(mode === "saved" ? [savedProjectPath] : [])],
        baseProjectPaths: adopted ? [projectPath] : [],
      },
      ...(adopted ? {
        baseFormPaths: {
          baseProjectPath: projectPath,
          ...(mode === "saved" ? { savedProjectPath } : {}),
        },
      } : {}),
      ...fullXmlSyncTestTopologyFields(projectPath),
    }
    const targetSnapshot: TestIndex = {
      files: [{ projectPath, contentHash: hashFileBytes(fs.readFileSync(sourcePath)) }],
      fragments: [{ targetProjectPath: projectPath, entities: [{ logicalAddress: elementAddress, xmlId: "1000010" }]}],
    }
    return {
      mode,
      adopted,
      projectDir,
      componentDir,
      baseComponentDir,
      projectPath,
      sourcePath,
      baseSourcePath,
      savedProjectPath,
      savedSourcePath,
      logicalAddress,
      assigned,
      baseDescriptor: await installTestIndex(projectDir, { kind: "configuration" }, baseSnapshot),
      targetDescriptor: await installTestIndex(
        projectDir,
        { kind: "configurationExtension", name: "Продажи" },
        targetSnapshot,
      ),
    }
  }

  function createProject(names: readonly string[]): string {
    const projectDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-full-sync-worker-"))
    tempDirs.push(projectDir)
    for (const name of names) {
      const dir = join(projectDir, "Справочник", name)
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(join(dir, "Свойства.yaml"), `Имя: ${name}\n`)
    }
    return projectDir
  }

  function createPersistentProject(names: readonly string[]): string {
    const projectDir = createProject(names)
    tempDirs.splice(tempDirs.indexOf(projectDir), 1)
    persistentDirs.push(projectDir)
    return projectDir
  }

  async function initialize(
    projectDir: string,
    assignments: readonly FullXmlSyncAssignment[],
    workerContext: ConfigurationContext = context,
    baseSnapshot?: TestIndex,
    openReadSession: (token: ProjectStateReadToken) => ProjectStateReadSession = () => emptyReadSession(),
    projectStateReadSession?: ProjectStateReadSession,
    targetSnapshot?: TestIndex,
    outputTarget: FullXmlSyncOutputTarget = { kind: "directory", outputDir: join(projectDir, ".out") },
    typeDescriptionXMLNameByType?: Readonly<Record<string, string>>,
    profileOverride?: FullXmlSyncWorkerProfileRuntime,
    targetDescriptorOverride?: ConfigurationIndexStoreDescriptor,
  ): Promise<void> {
    const targetDescriptor = targetDescriptorOverride ?? (targetSnapshot === undefined
      ? sharedEmptyIndexDescriptor
      : await installTestIndex(projectDir, { kind: "configuration" }, targetSnapshot))
    const baseDescriptor = baseSnapshot === undefined
      ? undefined
      : await installTestIndex(projectDir, { kind: "configurationExtension", name: "base-test" }, baseSnapshot)
    await runFullXmlSyncWorkerCommand({
      kind: "initialize",
      workerIndex: 0,
      componentPath: "cf",
      componentDir: projectDir,
      outputTarget,
      context: workerContext,
      profile: profileOverride ?? {
        kind: baseSnapshot === undefined ? "configuration" : "configurationExtension",
        componentKind: baseSnapshot === undefined ? "configuration" : "configurationExtension",
        adoptedUuids: {},
        ...(typeDescriptionXMLNameByType === undefined ? {} : { typeDescriptionXMLNameByType }),
        ...(baseSnapshot === undefined
          ? {}
          : {
              baseForms: {
                componentDir: projectDir,
                projectFiles: [],
                snapshot: baseDescriptor!,
              },
            }),
      },
      composition: createFullXmlSyncCompositionSnapshot(assignments),
      targetIndex: targetDescriptor,
      ...(baseDescriptor === undefined ? {} : { baseIndex: baseDescriptor }),
      operationSeed: new Uint8Array(32),
      ...(projectStateReadSession === undefined ? { projectStateReadToken: readToken } : {}),
    }, {
      openReadSession,
      ...(projectStateReadSession === undefined ? {} : { projectStateReadSession }),
    })
  }
})

const emptyReadSession = emptyProjectStateReadSession

function assignment(projectDir: string, name: string): FullXmlSyncExecutionAssignment {
  const sourcePath = join(projectDir, "Справочник", name, "Свойства.yaml")
  return {
    id: `Справочник/${name}/Свойства.yaml`,
    sourceProjectPath: `Справочник/${name}/Свойства.yaml`,
    sourcePath,
    expectedContentHash: hashFileBytes(fs.readFileSync(sourcePath)),
    role: "properties",
    itemType: "MetadataCatalog",
    itemName: name,
    logicalAddress: `Справочник.${name}`,
    configurationIndexSources: { targetProjectPaths: [`Справочник/${name}/Свойства.yaml`], baseProjectPaths: [] },
    ...fullXmlSyncTestTopologyFields(`Справочник/${name}/Свойства.yaml`),
  }
}

function flatSessionParameterAssignment(
  projectDir: string,
  name: string,
): FullXmlSyncExecutionAssignment {
  const sourcePath = join(projectDir, "ПараметрСеанса", `${name}.yaml`)
  return {
    id: `ПараметрСеанса/${name}.yaml`,
    sourceProjectPath: `ПараметрСеанса/${name}.yaml`,
    sourcePath,
    expectedContentHash: hashFileBytes(fs.readFileSync(sourcePath)),
    role: "properties",
    itemType: "MetadataSessionParameter",
    itemName: name,
    logicalAddress: `ПараметрСеанса.${name}`,
    configurationIndexSources: { targetProjectPaths: [`ПараметрСеанса/${name}.yaml`], baseProjectPaths: [] },
    ...fullXmlSyncTestTopologyFields(`ПараметрСеанса/${name}.yaml`),
  }
}

function targetIndexForAssignment(assigned: FullXmlSyncAssignment): TestIndex {
  return {
    files: [{ projectPath: assigned.sourceProjectPath, contentHash: assigned.expectedContentHash }],
    fragments: [],
  }
}

function configurationState(
  projectDir: string,
  assigned: FullXmlSyncExecutionAssignment,
  descriptor: ConfigurationIndexStoreDescriptor,
): ConfirmedComponentState {
  const projectFile = {
    projectPath: assigned.sourceProjectPath,
    contentHash: assigned.expectedContentHash,
  }
  return {
    structure: {
      address: { kind: "configuration" },
      componentPath: "cf",
      componentDir: projectDir,
      topology: {} as ConfirmedComponentState["structure"]["topology"],
      resources: [],
      projectPaths: [assigned.sourceProjectPath],
    },
    hashes: { componentPath: "cf", projectFiles: [projectFile] },
    indexes: {
      componentPath: "cf",
      sourceProjectFiles: [projectFile],
      logicalAddresses: [{
        logicalAddress: assigned.logicalAddress,
        sourceProjectPath: assigned.sourceProjectPath,
      }],
    },
    snapshot: { descriptor, projectFiles: [projectFile] },
    projectStateReadToken: createTestProjectStateReadToken(),
  }
}

interface TestIndex {
  readonly files: readonly ConfigurationProjectFile[]
  readonly fragments: readonly ConfigurationIndexBlockFragment[]
}

function emptyTestIndex(): TestIndex {
  return { files: [], fragments: [] }
}

async function installTestIndex(
  projectDir: string,
  address: { kind: "configuration" } | { kind: "configurationExtension"; name: string },
  snapshot: TestIndex,
): Promise<ConfigurationIndexStoreDescriptor> {
  const candidate = await createConfigurationIndexCandidateStore({
    projectDir,
    address,
    operationId: `test-${Math.random()}`,
    purpose: "full",
  })
  candidate.replaceHashes(snapshot.files)
  for (const fragment of snapshot.fragments) candidate.mergeBlockFragment(fragment)
  await candidate.close()
  const descriptor = candidate.descriptor()
  return descriptor
}
