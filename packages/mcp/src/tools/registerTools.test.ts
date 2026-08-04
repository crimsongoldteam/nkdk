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
      "nkdk.close_platform_connection",
      "nkdk.close_all_platform_connections",
      "nkdk.sync_to_xml",
      "nkdk.init_sync_state",
      "nkdk.rename_item",
      "nkdk.find_references",
    ])
    expect(calls.resources).toEqual([
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
    expect(infobaseImportTool?.description).toContain("пустой cf")
    expect(infobaseImportTool?.description).toContain("Запускает 1С")
    expect(infobaseImportTool?.description).toContain("параметры СУБД")

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

  it("passes the MCP cancellation signal to infobase import", async () => {
    const factory = (registerToolsModule as Record<string, unknown>)[
      "createImportFromInfobaseHandler"
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
      connectionString: 'File="/bases/demo";',
      allowWrite: true,
    }
    const controller = new AbortController()

    await handler(input, { signal: controller.signal })

    expect(service).toHaveBeenCalledWith(input, undefined, controller.signal)
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
