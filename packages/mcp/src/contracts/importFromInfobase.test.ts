import { describe, expect, it } from "vitest"
import { z } from "zod/v4"
import {
  importFromInfobaseInputShape,
  importFromInfobaseOutputShape,
} from "./importFromInfobase"

describe("import_from_infobase contract", () => {
  const inputSchema = z.strictObject(importFromInfobaseInputShape)

  it("accepts a configuration component", () => {
    expect(inputSchema.parse({
      projectDir: "/project",
      componentPath: "cfe/Расширение_All",
      allowWrite: true,
    })).toEqual({
      projectDir: "/project",
      componentPath: "cfe/Расширение_All",
      allowWrite: true,
    })
    expect(inputSchema.safeParse({ projectDir: "/project", componentPath: "cfe/.." }).success)
      .toBe(false)
  })

  it.each([
    "connectionString",
    "user",
    "password",
    "database",
    "useStandaloneServer",
  ])("rejects the connection field %s", (forbidden) => {
    expect(inputSchema.safeParse({ projectDir: "/project", [forbidden]: "x" }).success)
      .toBe(false)
  })

  it("parses a missing settings result with a schema reference", () => {
    expect(importFromInfobaseOutputShape.parse({
      ok: false,
      code: "project_settings_required",
      message: "Создайте файл настроек проекта и повторите импорт.",
      details: {
        settingsPath: "/project/.nkdk/project.yaml",
        schema: {
          uri: "nkdk://project-settings/schema/v1",
          format: "application/schema+json",
        },
      },
    })).toMatchObject({ code: "project_settings_required" })
  })

  it("parses invalid settings diagnostics", () => {
    expect(importFromInfobaseOutputShape.parse({
      ok: false,
      code: "invalid_project_settings",
      message: "Исправьте файл настроек проекта и повторите импорт.",
      details: {
        settingsPath: "/project/.nkdk/project.yaml",
        diagnostics: [{ code: "required", path: "infobase.connectionString", message: "Поле не задано" }],
        schema: {
          uri: "nkdk://project-settings/schema/v1",
          format: "application/schema+json",
        },
      },
    })).toMatchObject({ code: "invalid_project_settings" })
  })

  it("parses typed platform failure details", () => {
    expect(importFromInfobaseOutputShape.parse({
      ok: false,
      code: "authentication_failed",
      message: "Access denied",
      details: {
        stage: "authentication",
        mode: "designer-agent",
        temporaryDirectory: "/project/.nkdk/tmp/import-from-infobase/op-1",
        log: {
          uri: "file:///project/.nkdk/tmp/import-from-infobase/op-1/platform.log",
          format: "text/plain",
        },
      },
    })).toMatchObject({ code: "authentication_failed" })
  })

  it("accepts a preserved temporary directory in a successful partial import", () => {
    expect(importFromInfobaseOutputShape.parse({
      ok: true,
      succeeded: 1,
      failed: [{
        severity: "error",
        code: "failed",
        targetProjectPath: "Catalogs/Test.xml",
        message: "failed",
      }],
      warnings: [],
      mode: "designer-agent",
      reusedConnection: false,
      temporaryDirectory: "/project/.nkdk/tmp/import-from-infobase/op-1",
    })).toMatchObject({ ok: true })
  })

  it("parses a core failure with a preserved temporary directory", () => {
    expect(importFromInfobaseOutputShape.parse({
      ok: false,
      code: "core_error",
      message: "Не удалось импортировать конфигурацию",
      details: { temporaryDirectory: "/project/.nkdk/tmp/import-from-infobase/op-1" },
    })).toMatchObject({ ok: false, code: "core_error" })
  })
})
