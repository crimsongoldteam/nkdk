import { describe, expect, it, vi } from "vitest"
import type { Diagnostic } from "@nkdk/runtime"
import type { ProjectStateService } from "../projectState"
import { createTestProjectStateReadToken } from "../projectState/tests/readToken"
import { attachBorrowedFormPaths } from "../fullSyncToXml/borrowedFormPlan"
import type { FullXmlSyncAssignment } from "../fullSyncToXml/types"
import {
  preparePartialXmlSyncPackage,
  type PartialXmlSyncCoordinatorDependencies,
} from "./preparePartialXmlSyncPackage"

describe("подготовка частичного XML-пакета", () => {
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
    context: { version: "2.20", defaultLanguage: "ru" } as const,
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
    refresh: vi.fn(async () => ({
      diagnostics: [] as readonly Diagnostic[],
      readToken: createTestProjectStateReadToken(),
    })),
    prepareValidated: vi.fn(async () => result),
  } satisfies PartialXmlSyncCoordinatorDependencies
}
