import { describe, expect, it, vi } from "vitest"
import type { Diagnostic } from "@nkdk/runtime"
import type { ProjectStateService } from "../projectState"
import type { FullXmlSyncGeneratedDocument } from "../fullSyncToXml/types"
import { createTestProjectStateReadToken } from "../projectState/tests/readToken"
import { attachBorrowedFormPaths } from "../fullSyncToXml/borrowedFormPlan"
import type { FullXmlSyncAssignment } from "../fullSyncToXml/types"
import {
  preparePartialXmlSyncPackage,
  writePreparedPartialXmlSyncPackage,
  type PartialXmlSyncCoordinatorDependencies,
} from "./preparePartialXmlSyncPackage"
import { createPartialXmlAnomalyExecutionFixture } from "./tests/xmlAnomalyTestHelper"

describe("подготовка частичного XML-пакета", () => {
  it("ведёт исходный YAML через production partial writer и full-sync worker", async () => {
    const fixture = createPartialXmlAnomalyExecutionFixture("/project")
    const addGenerated = vi.fn(async (_document: FullXmlSyncGeneratedDocument) => undefined)
    const writePending = vi.fn(async () => undefined)
    const dependencies = boundary({ ok: true, status: "unchanged", diagnostics: [] })
    dependencies.prepareValidated.mockImplementation((validated) =>
      writePreparedPartialXmlSyncPackage({ ...validated, ...fixture.stage }, {
        packageId: () => "package-anomaly",
        operationSeed: () => new Uint8Array(32),
        createWriter: () => ({
          addGenerated,
          async addExternal() {},
          async close() {
            return { archiveHash: 1n, entries: [fixture.targetXmlPath, "load.lst"] }
          },
          async abort() {},
        }),
        createWorkerPool: fixture.createWorkerPool,
        writePending,
        async buildPendingDelta() { return { hashes: new Map(), blocks: new Map() } },
      }),
    )

    const result = await preparePartialXmlSyncPackage(params(), dependencies)

    expect(result.ok ? "" : result.diagnostics.map(({ message }) => message).join("; ")).toBe("")
    expect(result).toMatchObject({ ok: true, status: "prepared", packageId: "package-anomaly" })
    expect(addGenerated).toHaveBeenCalledOnce()
    const document = addGenerated.mock.calls[0]![0]
    const xml = new TextDecoder().decode(document.content)
    expect(xml).toContain("<Value>01</Value>")
    expect(xml).not.toContain("ordinary")
    expect(writePending).toHaveBeenCalledWith(expect.objectContaining({
      state: expect.objectContaining({ loadTargets: [fixture.targetXmlPath] }),
    }))
  })

  it.each([
    ["сохранённой", "Объект/Товары/Формы/ФормаЭлемента/БазоваяФорма.yaml"],
    ["удалённой", undefined],
  ] as const)("передаёт подтверждённый источник %s основы в задание формы", (_case, savedProjectPath) => {
    const assignment = formAssignment()
    const plan = attachBorrowedFormPaths({ assignments: [assignment], externalFiles: [] }, {
      borrowedForms: [{
        logicalAddress: assignment.logicalAddress,
        extensionProjectPath: assignment.sourceProjectPath,
        baseProjectPath: assignment.sourceProjectPath,
        ...(savedProjectPath === undefined ? {} : { savedProjectPath }),
      }],
    })

    expect(plan.assignments[0]?.baseFormPaths).toEqual({
      baseProjectPath: assignment.sourceProjectPath,
      ...(savedProjectPath === undefined ? {} : { savedProjectPath }),
    })
  })

  it("возвращает unchanged без запуска подготовки ZIP", async () => {
    const dependencies = boundary({ ok: true, status: "unchanged", diagnostics: [] })

    const result = await preparePartialXmlSyncPackage(params(), dependencies)

    expect(result).toEqual({ ok: true, status: "unchanged", diagnostics: [] })
    expect(dependencies.prepareValidated).toHaveBeenCalledOnce()
  })

  it("останавливается после ошибки валидации и не начинает подготовку ZIP", async () => {
    const diagnostic = {
      filePath: "/project/cf/Configuration.yaml",
      line: 1,
      col: 1,
      severity: "error" as const,
      source: "structure" as const,
      message: "ошибка",
    }
    const dependencies = boundary({ ok: true, status: "unchanged", diagnostics: [] })
    dependencies.refresh.mockResolvedValue({
      diagnostics: [diagnostic],
      readToken: createTestProjectStateReadToken(),
    })

    const result = await preparePartialXmlSyncPackage(params(), dependencies)

    expect(result).toEqual({ ok: false, diagnostics: [diagnostic] })
    expect(dependencies.prepareValidated).not.toHaveBeenCalled()
  })

  it("возвращает диагностику при сбое подготовки", async () => {
    const dependencies = boundary({ ok: true, status: "unchanged", diagnostics: [] })
    dependencies.prepareValidated.mockRejectedValue(new Error("ZIP close failed"))

    const result = await preparePartialXmlSyncPackage(params(), dependencies)

    expect(result.ok).toBe(false)
    expect(result.diagnostics[0]?.message).toContain("ZIP close failed")
  })

  it("возвращает подготовленный пакет, не выполняя отдельную фиксацию", async () => {
    const prepared = {
      ok: true as const,
      status: "prepared" as const,
      packageId: "package-1",
      archivePath: "/project/.nkdk/tmp/incremental-sync/cf/package-1.zip",
      archiveHash: "0000000000000001",
      entries: ["Configuration.xml", "load.lst"],
      loadTargets: ["Configuration.xml"],
      diagnostics: [],
    }
    const dependencies = boundary(prepared)

    await expect(preparePartialXmlSyncPackage(params(), dependencies)).resolves.toEqual(prepared)
  })

  it.each(["transferring", "applied"] as const)(
    "не удаляет пакет в фазе %s и не начинает новую подготовку",
    async (status) => {
      const dependencies = boundary({ ok: true, status: "unchanged", diagnostics: [] })
      dependencies.readPending.mockResolvedValue({ delivery: { status } } as never)

      const result = await preparePartialXmlSyncPackage(params(), dependencies)

      expect(result).toMatchObject({ ok: false })
      expect(dependencies.refresh).not.toHaveBeenCalled()
    },
  )
})

function formAssignment(): FullXmlSyncAssignment {
  return {
    id: "form",
    sourceProjectPath: "Объект/Товары/Формы/ФормаЭлемента/Форма.yaml",
    sourcePath: "/project/cfe/Расширение/Объект/Товары/Формы/ФормаЭлемента/Форма.yaml",
    expectedContentHash: 1n,
    role: "form",
    itemType: "ClientApplicationForm",
    itemName: "ФормаЭлемента",
    logicalAddress: "Объект.Товары.Форма.ФормаЭлемента",
    nodeId: "form-node",
    potentialOutputs: [],
  }
}

function params() {
  return {
    context: { version: "2.20", languages: { default: "ru", registered: ["ru"], registeredSet: new Set(["ru"]), version: '["ru",["ru"]]' } } as const,
    projectDir: "/project/../project",
    componentPath: "cf",
    projectState: {} as ProjectStateService,
  }
}

function boundary(
  result: Awaited<ReturnType<PartialXmlSyncCoordinatorDependencies["prepareValidated"]>>,
) {
  return {
    readPending: vi.fn(async () => undefined),
    assertNoPending: vi.fn(async () => undefined),
    refresh: vi.fn(async () => ({
      diagnostics: [] as readonly Diagnostic[],
      readToken: createTestProjectStateReadToken(),
    })),
      prepareValidated: vi.fn(async (_params: Parameters<PartialXmlSyncCoordinatorDependencies["prepareValidated"]>[0]) => result),
  } satisfies PartialXmlSyncCoordinatorDependencies
}
