import { describe, expect, it, vi } from "vitest"
import { z } from "zod/v4"
import * as registerToolsModule from "./registerTools"

const { registerNkdkCapabilities } = registerToolsModule

describe("registerNkdkCapabilities", () => {
  it("registers operation tools, base tools, resources, and prompts", () => {
    const calls = {
      tools: [] as string[],
      resources: [] as string[],
      prompts: [] as string[],
    }
    const server = {
      registerTool: vi.fn((name: string, _options?: unknown, _handler?: unknown) => calls.tools.push(name)),
      registerResource: vi.fn((name: string) => calls.resources.push(name)),
      registerPrompt: vi.fn((name: string) => calls.prompts.push(name)),
    }

    registerNkdkCapabilities(server as unknown as Parameters<typeof registerNkdkCapabilities>[0])

    expect(calls.tools).toEqual([
      "nkdk.get_schema",
      "nkdk.describe_project_structure",
      "nkdk.list_infobases",
      "nkdk.list_infobase_extensions",
      "nkdk.validate_project",
      "nkdk.reset_project_cache",
      "nkdk.rebuild_project_cache",
      "nkdk.import_from_xml",
      "nkdk.import_from_infobase",
      "nkdk.sync_to_infobase",
      "nkdk.close_platform_connection",
      "nkdk.close_all_platform_connections",
      "nkdk.sync_to_xml",
      "nkdk.init_sync_state",
      "nkdk.rename_item",
      "nkdk.find_references",
    ])
    expect(calls.resources).toEqual([
      "project-settings-schema",
      "config-edit-yaml",
      "config-import-from-xml",
      "config-sync-to-xml",
      "config-validate-yaml",
    ])
    expect(calls.prompts).toEqual([
      "nkdk_config_edit_yaml",
      "nkdk_config_import_from_xml",
      "nkdk_config_sync_to_xml",
      "nkdk_config_validate_yaml",
    ])

    const validateTool = server.registerTool.mock.calls.find(([name]) => name === "nkdk.validate_project")?.[1] as
      | { description: string }
      | undefined
    expect(validateTool?.description).toContain("все компоненты")
    expect(validateTool?.description).not.toContain("компонент cf")

    const importTool = server.registerTool.mock.calls.find(([name]) => name === "nkdk.import_from_xml")?.[1] as
      | { description: string }
      | undefined
    expect(importTool?.description).toContain("одного компонента")
    expect(importTool?.description).toContain("цель должна отсутствовать или быть пустой")
    expect(importTool?.description).toContain("расширения путь определяется из Configuration.xml")
    expect(importTool?.description).toContain("componentPath передавать не требуется")
    expect(importTool?.description).not.toContain(".nkdk/tmp/import/<operation-id>")
    expect(importTool?.description).toContain("не подключается к 1С")
    expect(importTool?.description).toContain("не импортирует все компоненты")

    const infobaseImportTool = server.registerTool.mock.calls.find(
      ([name]) => name === "nkdk.import_from_infobase"
    )?.[1] as { description: string } | undefined
    expect(infobaseImportTool?.description).toContain("allowWrite=true")
    expect(infobaseImportTool?.description).toContain(".nkdk/project.yaml")
    expect(infobaseImportTool?.description).toContain("по умолчанию cf")
    expect(infobaseImportTool?.description).toContain("cfe/<Имя>")
    expect(infobaseImportTool?.description).toContain("цель должна отсутствовать или быть пустой")
    expect(infobaseImportTool?.description).toContain("cf импортируется первым")
    expect(infobaseImportTool?.description).toContain("Запускает 1С")
    expect(infobaseImportTool?.description).toContain("повторить импорт")
    const infobaseImportOptions = server.registerTool.mock.calls.find(
      ([name]) => name === "nkdk.import_from_infobase"
    )?.[1] as { inputSchema: Record<string, z.ZodType>; outputSchema?: z.ZodType } | undefined
    expect(z.strictObject(infobaseImportOptions?.inputSchema ?? {}).safeParse({
      projectDir: "/project",
      allowWrite: true,
    }).success).toBe(true)
    expect(z.strictObject(infobaseImportOptions?.inputSchema ?? {}).safeParse({
      projectDir: "/project",
      connectionString: 'File="/base";',
    }).success).toBe(false)
    expect(infobaseImportOptions?.outputSchema).toBeDefined()
    expect(infobaseImportOptions?.outputSchema).toBeInstanceOf(z.ZodObject)

    const infobaseSync = server.registerTool.mock.calls.find(
      ([name]) => name === "nkdk.sync_to_infobase"
    )?.[1] as { description: string; inputSchema: z.ZodType; outputSchema?: z.ZodType } | undefined
    expect(infobaseSync?.description.toLowerCase()).toContain("частично")
    expect(infobaseSync?.description).toContain("cf")
    expect(infobaseSync?.description).toContain("cfe/<Имя>")
    expect(infobaseSync?.description).toContain("Запускает платформу")
    expect(infobaseSync?.description).toContain("allowWrite=true")
    expect(infobaseSync?.description).toContain("обновляет конфигурацию базы данных")
    expect(infobaseSync?.inputSchema.safeParse({
      projectDir: "/project",
      componentPath: "cf",
      allowWrite: true,
    }).success).toBe(true)
    expect(infobaseSync?.inputSchema.safeParse({
      projectDir: "/project",
      componentPath: "cfe/..",
      allowWrite: true,
    }).success).toBe(false)
    const infobaseSyncOutput = infobaseSync?.outputSchema
    expect(infobaseSyncOutput).toBeDefined()
    if (infobaseSyncOutput === undefined) throw new Error("sync_to_infobase outputSchema отсутствует")
    expect(infobaseSyncOutput).toBeInstanceOf(z.ZodObject)
    expect(infobaseSyncOutput.safeParse({
      ok: true,
      status: "unchanged",
      componentPath: "cf",
      diagnostics: [],
    }).success).toBe(true)
    expect(infobaseSyncOutput.safeParse({
      ok: true,
      status: "unchanged",
      componentPath: "cf",
      diagnostics: [],
      packageId: "unexpected",
    }).success).toBe(false)

    for (const name of [
      "nkdk.close_platform_connection",
      "nkdk.close_all_platform_connections",
    ]) {
      const tool = server.registerTool.mock.calls.find(([registered]) => registered === name)?.[1] as
        | { description: string }
        | undefined
      expect(tool?.description).toContain("текущим MCP-процессом")
    }

    const syncTool = server.registerTool.mock.calls.find(([name]) => name === "nkdk.sync_to_xml")?.[1] as
      | { description: string }
      | undefined
    expect(syncTool?.description).toContain("файл индекса конфигурации")
    expect(syncTool?.description).toContain("projectDir/componentPath")
    expect(syncTool?.description).toContain("xmlRootDir/componentPath")
    expect(syncTool?.description).not.toContain("reference")
    expect(syncTool?.description).toContain("Проверки выполняются всегда")

    for (const name of ["nkdk.rename_item", "nkdk.find_references"]) {
      const tool = server.registerTool.mock.calls.find(([registered]) => registered === name)?.[1] as
        | { description: string }
        | undefined
      expect(tool?.description).toContain("Проверки выполняются всегда")
    }

    for (const name of [
      "nkdk.validate_project",
      "nkdk.rebuild_project_cache",
      "nkdk.import_from_xml",
      "nkdk.sync_to_xml",
      "nkdk.rename_item",
      "nkdk.find_references",
    ]) {
      const tool = server.registerTool.mock.calls.find(([registered]) => registered === name)?.[1] as
        | { outputSchema?: unknown }
        | undefined
      expect(tool?.outputSchema, `${name} должен объявлять outputSchema`).toBeDefined()
    }

    for (const name of ["nkdk.reset_project_cache", "nkdk.rebuild_project_cache"]) {
      const tool = server.registerTool.mock.calls.find(([registered]) => registered === name)?.[1] as
        | { inputSchema: z.ZodType }
        | undefined
      expect(tool?.inputSchema.safeParse({ projectDir: "/project", allowWrite: true }).success).toBe(true)
      expect(tool?.inputSchema.safeParse({ projectDir: "/project", allowWrite: false }).success).toBe(false)
      expect(tool?.inputSchema.safeParse({ projectDir: "/project", allowWrite: true, extra: 1 }).success).toBe(false)
    }

    const listInfobasesTool = server.registerTool.mock.calls.find(([name]) => name === "nkdk.list_infobases")?.[1] as
      | { description: string }
      | undefined
    expect(listInfobasesTool?.description).toContain("личного и общих списков")
    expect(listInfobasesTool?.description).toContain("дерево")
    expect(listInfobasesTool?.description).toContain("Не изменяет файлы")

    const listExtensionsTool = server.registerTool.mock.calls.find(
      ([name]) => name === "nkdk.list_infobase_extensions"
    )?.[1] as { description: string } | undefined
    expect(listExtensionsTool?.description).toContain(".nkdk/project.yaml")
    expect(listExtensionsTool?.description).toContain("агент")
    expect(listExtensionsTool?.description).toContain("ibcmd")
    expect(listExtensionsTool?.description).toContain("Не изменяет")
    const listExtensionsOptions = server.registerTool.mock.calls.find(
      ([name]) => name === "nkdk.list_infobase_extensions"
    )?.[1] as
      | { inputSchema: z.ZodType; outputSchema: z.ZodType }
      | undefined
    expect(
      listExtensionsOptions?.inputSchema.safeParse({
        projectDir: "/project",
        user: "Admin",
      }).success
    ).toBe(false)
    expect(
      listExtensionsOptions?.outputSchema.safeParse({
        ok: true,
        extensions: [],
        mode: "designer-agent",
        reusedConnection: false,
      }).success
    ).toBe(true)
  })

  it("возвращает краткую сводку и ссылку на полный отчёт без JSON-дубликата", () => {
    const payload = {
      ok: true as const,
      diagnostics: [],
      summary: { errors: 120, warnings: 3, shown: 100, omitted: 23 },
      truncated: true,
      report: { uri: "file:///project/.nkdk/reports/validation-op.jsonl", format: "application/x-ndjson" as const },
    }

    const result = registerToolsModule.metadataToolResult(payload, "Validation")

    expect(result.content).toEqual([
      { type: "text", text: "Validation: ошибок 120, предупреждений 3; показано 100, скрыто 23." },
      {
        type: "resource_link",
        uri: payload.report.uri,
        name: "Полный отчёт diagnostics",
        mimeType: "application/x-ndjson",
      },
    ])
    expect(result.structuredContent).toBe(payload)
  })

  it.each([
    ["infobase import", "createImportFromInfobaseHandler"],
    ["infobase synchronization", "createSyncToInfobaseHandler"],
  ])("passes the MCP cancellation signal to %s", async (_name, factoryName) => {
    const factory = (registerToolsModule as Record<string, unknown>)[
      factoryName
    ]
    expect(factory).toBeTypeOf("function")
    const service = vi.fn().mockResolvedValue({
      ok: false,
      code: "operation_cancelled",
      message: "cancelled",
    })
    const handler = (
      factory as (
        serviceFunction: typeof service
      ) => (
        input: Record<string, unknown>,
        extra: { signal: AbortSignal }
      ) => Promise<unknown>
    )(service)
    const input = {
      projectDir: "/project",
      allowWrite: true,
    }
    const controller = new AbortController()

    await handler(input, { signal: controller.signal })

    expect(service).toHaveBeenCalledWith(input, undefined, controller.signal)
  })

  it("presents a platform failure as concise text and a log link", () => {
    const payload = {
      ok: false as const,
      code: "authentication_failed" as const,
      message: "Access denied",
      details: {
        stage: "authentication",
        mode: "designer-agent",
        log: {
          uri: "file:///project/.nkdk/tmp/import-from-infobase/op-1/platform.log",
          format: "text/plain" as const,
        },
      },
    }

    expect(registerToolsModule.importFromInfobaseToolResult(payload).content).toEqual([
      { type: "text", text: "Access denied" },
      {
        type: "resource_link",
        uri: payload.details.log.uri,
        name: "Журнал импорта из информационной базы",
        mimeType: "text/plain",
      },
    ])
  })

  it("presents settings errors with the schema link and omits unavailable logs", () => {
    const schemaFailure = {
      ok: false as const,
      code: "project_settings_required" as const,
      message: "Создайте файл настроек проекта и повторите импорт.",
      details: {
        settingsPath: "/project/.nkdk/project.yaml",
        schema: { uri: "nkdk://project-settings/schema/v1", format: "application/schema+json" as const },
      },
    }
    expect(registerToolsModule.importFromInfobaseToolResult(schemaFailure).content.at(1)).toEqual({
      type: "resource_link",
      uri: schemaFailure.details.schema.uri,
      name: "Схема настроек проекта",
      mimeType: "application/schema+json",
    })

    const noLog = registerToolsModule.importFromInfobaseToolResult({
      ok: false,
      code: "platform_command_failed",
      message: "Журнал недоступен",
      details: { stage: "platform-log", mode: "designer-agent" },
    })
    expect(noLog.content).toEqual([{ type: "text", text: "Журнал недоступен" }])
  })

  it("presents synchronization failures with one relevant resource link", () => {
    const logFailure = {
      ok: false as const,
      code: "delivery_outcome_unknown" as const,
      message: "Неизвестно",
      details: {
        log: {
          uri: "file:///project/.nkdk/tmp/sync-to-infobase/attempt-1/platform.log",
          format: "text/plain" as const,
        },
      },
    }
    expect(registerToolsModule.syncToInfobaseToolResult(logFailure).content).toEqual([
      { type: "text", text: "Неизвестно" },
      {
        type: "resource_link",
        uri: logFailure.details.log.uri,
        name: "Журнал синхронизации с информационной базой",
        mimeType: "text/plain",
      },
    ])

    const success = {
      ok: true as const,
      status: "unchanged" as const,
      componentPath: "cf" as const,
      diagnostics: [],
    }
    expect(registerToolsModule.syncToInfobaseToolResult(success).content).toEqual([
      { type: "text", text: "Операция выполнена." },
    ])
  })

  it("passes the MCP cancellation signal to extension listing", async () => {
    const factory = (registerToolsModule as Record<string, unknown>)[
      "createListInfobaseExtensionsHandler"
    ]
    expect(factory).toBeTypeOf("function")
    const service = vi.fn().mockResolvedValue({
      ok: false,
      code: "operation_cancelled",
      message: "cancelled",
    })
    const handler = (
      factory as (
        serviceFunction: typeof service
      ) => (
        input: Record<string, unknown>,
        extra: { signal: AbortSignal }
      ) => Promise<unknown>
    )(service)
    const input = { projectDir: "/project" }
    const controller = new AbortController()

    await handler(input, { signal: controller.signal })

    expect(service).toHaveBeenCalledWith(input, undefined, controller.signal)
  })
})
