import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { isAbsolute, join, relative, resolve, sep } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import type { PreparedYamlProjectWorkerTask } from "../project/preparedYamlProjectWorker"
import type { Diagnostic } from "./types"
import {
  createValidationWorkerPoolHandle,
  toRootProjectDiagnostic,
} from "./validateProject"

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe("validateProject coordinator", () => {
  it("uses only the full-project worker protocol", async () => {
    const projectDir = createProject()
    const harness = createValidationHarness()

    try {
      await harness.handle.validateProject({ projectDir })

      expect(harness.commands.map(({ kind }) => kind)).toEqual([
        "initValidation",
        "validateFirstPass",
        "validateSecondPass",
      ])
      expect(harness.commands.map(({ kind }) => kind)).not.toContain(
        `validate${"Partial"}`
      )
    } finally {
      await harness.handle.close()
    }
  })

  it("reports a missing cf component without subject validation", async () => {
    const projectDir = createTempDir()
    const harness = createValidationHarness()

    try {
      const result = await harness.handle.validateProject({ projectDir })

      expect(result.diagnostics).toEqual([
        expect.objectContaining({
          severity: "error",
          source: "structure",
          message: expect.stringContaining("конфигурац"),
        }),
      ])
    } finally {
      await harness.handle.close()
    }
  })

  it("publishes first- and second-pass diagnostics in stable order", async () => {
    const projectDir = createProject()
    const firstPath = join(projectDir, "cf", "Язык", "Русский.yaml")
    const secondPath = join(projectDir, "cf", "Конфигурация.yaml")
    const harness = createValidationHarness({
      firstPassDiagnostics: [
        diagnostic(firstPath, "first", "structure"),
      ],
      secondPassDiagnostics: [
        diagnostic(secondPath, "second", "cross-file"),
      ],
    })

    try {
      const result = await harness.handle.validateProject({ projectDir })

      expect(result.diagnostics.map(({ filePath, message }) => ({
        filePath,
        message,
      }))).toEqual([
        { filePath: "cf/Конфигурация.yaml", message: "second" },
        { filePath: "cf/Язык/Русский.yaml", message: "first" },
      ])
    } finally {
      await harness.handle.close()
    }
  })

  it("passes blocked components to the second worker pass", async () => {
    const projectDir = createProject()
    const extensionDir = join(projectDir, "cfe", "Расширение")
    mkdirSync(extensionDir, { recursive: true })
    writeFileSync(
      join(extensionDir, "Конфигурация.yaml"),
      "Имя: Расширение\n"
    )
    const harness = createValidationHarness({
      firstPassSchemaDiagnostics: [
        diagnostic(
          join(projectDir, "cf", "Конфигурация.yaml"),
          "invalid cf",
          "structure"
        ),
      ],
    })

    try {
      await harness.handle.validateProject({ projectDir })

      const secondPass = harness.commands.find(
        (command) => command.kind === "validateSecondPass"
      )
      expect(secondPass).toMatchObject({
        kind: "validateSecondPass",
        blockedComponentPaths: ["cfe/Расширение"],
      })
    } finally {
      await harness.handle.close()
    }
  })

  it("reuses a mock physical worker across handle operations", async () => {
    const firstProject = createProject()
    const secondProject = createProject()
    const harness = createValidationHarness()

    try {
      await harness.handle.validateProject({ projectDir: firstProject })
      await harness.handle.validateProject({ projectDir: secondProject })

      expect(
        harness.commands.filter(({ kind }) => kind === "initValidation")
      ).toHaveLength(1)
      expect(
        harness.commands.filter(({ kind }) => kind === "validateFirstPass")
      ).toHaveLength(2)
      expect(
        harness.commands.filter(({ kind }) => kind === "validateSecondPass")
      ).toHaveLength(2)
    } finally {
      await harness.handle.close()
    }
  })
})

describe("toRootProjectDiagnostic", () => {
  it("returns a project-relative path", () => {
    const projectDir = resolve("/project")

    expect(
      toRootProjectDiagnostic(
        projectDir,
        diagnostic(
          join(projectDir, "cf", "Конфигурация.yaml"),
          "invalid",
          "structure"
        )
      )
    ).toMatchObject({
      filePath: join("cf", "Конфигурация.yaml"),
      message: "invalid",
    })
  })

  it("rejects a diagnostic path outside projectDir", () => {
    const projectDir = resolve("/project")
    const outsidePath = resolve("/other/Свойства.yaml")

    expect(() =>
      toRootProjectDiagnostic(
        projectDir,
        diagnostic(outsidePath, "outside", "structure")
      )
    ).toThrow("за пределами projectDir")
  })
})

function createValidationHarness(options: {
  firstPassDiagnostics?: Diagnostic[]
  firstPassSchemaDiagnostics?: Diagnostic[]
  secondPassDiagnostics?: Diagnostic[]
} = {}) {
  const commands: PreparedYamlProjectWorkerTask[] = []
  const handle = createValidationWorkerPoolHandle({
    concurrency: 1,
    createWorkerPool: () => ({
      async run(command: PreparedYamlProjectWorkerTask) {
        commands.push(command)
        if (command.kind === "initValidation") {
          return {
            kind: "initValidationResult" as const,
            formMs: 0,
            propertiesMs: 0,
            totalMs: 0,
          }
        }
        if (command.kind === "validateFirstPass") {
          const componentPaths = [
            ...new Set(command.files.map(({ componentPath }) => componentPath)),
          ]
          const schemaDiagnostics = options.firstPassSchemaDiagnostics ?? []
          const diagnostics = [
            ...(options.firstPassDiagnostics ?? []),
            ...schemaDiagnostics,
          ]
          return {
            kind: "validateFirstPassResult" as const,
            components: componentPaths.map((componentPath) => ({
              componentPath,
              contribution: {
                objectRecords: [],
                objectIndexEntries: [],
                memberIndexEntries: [],
                valueIndexEntries: [],
                pendingReferences: [],
              },
              diagnostics: diagnostics.filter((item) =>
                belongsToComponent(item.filePath, command.projectDir, componentPath)
              ),
              schemaDiagnostics: schemaDiagnostics.filter((item) =>
                belongsToComponent(
                  item.filePath,
                  command.projectDir,
                  componentPath
                )
              ),
              fileResults: [],
            })),
            diagnostics,
            schemaDiagnostics,
            fileResults: [],
            yamlLifetime: {
              current: 0,
              max: 0,
              parsed: command.files.length,
              propertyEvents: 0,
            },
          }
        }
        if (command.kind === "validateSecondPass") {
          return {
            kind: "validateSecondPassResult" as const,
            diagnostics: options.secondPassDiagnostics ?? [],
          }
        }
        throw new Error(`Неожиданная команда: ${command.kind}`)
      },
      async destroy() {
        return undefined
      },
    }),
  })

  return { handle, commands }
}

function createProject(): string {
  const projectDir = createTempDir()
  const cfDir = join(projectDir, "cf")
  mkdirSync(cfDir, { recursive: true })
  writeFileSync(join(cfDir, "Конфигурация.yaml"), "Имя: Конфигурация\n")
  return projectDir
}

function createTempDir(): string {
  const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-unit-"))
  tempDirs.push(projectDir)
  return projectDir
}

function diagnostic(
  filePath: string,
  message: string,
  source: Diagnostic["source"]
): Diagnostic {
  return {
    filePath,
    line: 1,
    col: 1,
    severity: "error",
    source,
    message,
  }
}

function belongsToComponent(
  filePath: string,
  projectDir: string,
  componentPath: string
): boolean {
  const relativePath = isAbsolute(filePath)
    ? relative(projectDir, filePath)
    : filePath
  return (
    relativePath === componentPath ||
    relativePath.startsWith(`${componentPath}${sep}`)
  )
}
