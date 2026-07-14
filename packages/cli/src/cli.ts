#!/usr/bin/env node
import { Command } from "commander"
import { resolve } from "path"
import { pathToFileURL } from "url"
import { importConfiguration } from "./commands/import"
import { initSyncState } from "./commands/initSyncState"
import { deleteMigration, generateMigration, renameMigration } from "./commands/migration"
import { normalizeSchemaCommandInput, printSchema, type SchemaCommandOptions } from "./commands/schema"
import { shortRoundTrip } from "./commands/shortRoundTrip"
import { syncConfiguration } from "./commands/sync"
import { validateYamlProject, type ValidateCommandOptions } from "./commands/validate"

interface CreateProgramOptions {
  exitOnUnhandledError?: boolean
}

function run(fn: () => Promise<void>, options: CreateProgramOptions): Promise<void> {
  return fn().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err)
    process.stderr.write(msg + "\n")
    if (process.env["DEBUG"] === "1" && err instanceof Error && err.stack) {
      process.stderr.write(err.stack + "\n")
    }
    if (options.exitOnUnhandledError === true) process.exit(1)
    process.exitCode = process.exitCode ?? 1
  })
}

export function createProgram(options: CreateProgramOptions = {}): Command {
  const program = new Command()

  program
    .command("import")
    .description("Импорт конфигурации из XML в YAML (XML → YAML)")
    .argument("<xml-dir>", "путь к каталогу XML-выгрузки")
    .argument("<yaml-dir>", "путь к каталогу YAML-проекта")
    .action((xmlDir: string, yamlDir: string) => {
      return run(() => importConfiguration(xmlDir, yamlDir), options)
    })

  program
    .command("sync")
    .description("Синхронизация конфигурации из YAML в XML (YAML → XML)")
    .argument("<yaml-dir>", "путь к каталогу YAML-проекта")
    .argument("<xml-dir>", "путь к каталогу XML-выгрузки")
    .option("--reference <xml-dir>", "путь к XML-каталогу для чтения reference-данных")
    .action((yamlDir: string, xmlDir: string, opts: { reference?: string }) => {
      return run(
        () =>
          syncConfiguration(yamlDir, xmlDir, {
            referenceDir: opts.reference,
          }),
        options
      )
    })

  program
    .command("init-sync-state")
    .description("Создать файл состояния инкрементальной XML-синхронизации")
    .argument("<yaml-dir>", "путь к каталогу YAML-проекта")
    .argument("<xml-dir>", "путь к каталогу XML-выгрузки")
    .action((yamlDir: string, xmlDir: string) => {
      return run(() => initSyncState(yamlDir, xmlDir), options)
    })

  program
    .command("short-round-trip-test")
    .description("Проверка round-trip XML → модель → XML (без YAML-слоя)")
    .argument("<xml-dir>", "путь к каталогу XML-выгрузки")
    .action((xmlDir: string) => {
      return run(() => shortRoundTrip(xmlDir), options)
    })

  program
    .command("schema")
    .description("Показать YAML-сводку JSON Schema для YAML-файла проекта или имени схемы")
    .argument("[target]", "путь к YAML-файлу проекта или имя схемы")
    .option("--project <yamlDir>", "путь к корню YAML-проекта")
    .option("--json-schema", "вывести точную JSON Schema вместо YAML-сводки")
    .option("--inline", "развернуть составные подсхемы в режиме --json-schema")
    .option("--keys [terms]", "вывести только имена полей; terms фильтрует по частям строки через |")
    .option("--required", "показать только обязательные поля")
    .option("--search <terms>", "найти поля по частям строки через |")
    .option("--exact", "точный поиск имени поля в режиме --search")
    .action((target: string | undefined, opts: SchemaCommandOptions) => {
      return run(() => {
        const normalized = normalizeSchemaCommandInput(target, opts)
        return printSchema(normalized.target, normalized.options)
      }, options)
    })

  program
    .command("validate")
    .description("Проверить YAML-проект")
    .argument("[yaml-dir]", "путь к каталогу YAML-проекта")
    .option("--file <path>", "проверить один YAML-файл проекта")
    .action((yamlDir: string | undefined, opts: ValidateCommandOptions) => {
      return run(() => validateYamlProject(yamlDir ?? "", opts), options)
    })

  program
    .command("rename")
    .description("Переименовать metadata-объект или дочерний элемент")
    .argument("<yaml-dir>", "путь к каталогу YAML-проекта")
    .argument("<path>", "полный путь элемента")
    .argument("<new-name>", "новое локальное имя")
    .option("--write", "записать изменения; без флага печатается план")
    .action((yamlDir: string, path: string, newName: string, opts: { write?: boolean }) => {
      return run(() => Promise.resolve(renameMigration(yamlDir, path, newName, opts.write === true)), options)
    })

  program
    .command("delete")
    .description("Удалить metadata-объект или дочерний элемент")
    .argument("<yaml-dir>", "путь к каталогу YAML-проекта")
    .argument("<path>", "полный путь элемента")
    .option("--write", "записать изменения; без флага печатается план")
    .action((yamlDir: string, path: string, opts: { write?: boolean }) => {
      return run(() => Promise.resolve(deleteMigration(yamlDir, path, opts.write === true)), options)
    })

  program
    .command("generate-migration")
    .description("Создать миграцию для неоднозначных структурных изменений")
    .argument("<yaml-dir>", "путь к каталогу YAML-проекта")
    .argument("<xml-dir>", "путь к каталогу XML-выгрузки")
    .option("--dry-run", "показать конфликты без записи файла")
    .action((yamlDir: string, xmlDir: string, opts: { dryRun?: boolean }) => {
      return run(async () => {
        const result = await generateMigration({ yamlDir, xmlDir, dryRun: opts.dryRun === true })
        if (result.conflicts.length > 0) {
          for (const conflict of result.conflicts) {
            process.stdout.write(
              `${conflict.levelPath}: удалено [${conflict.deleted.join(", ")}], добавлено [${conflict.added.join(", ")}]\n`
            )
          }
        }
        if (result.exitCode !== 0) process.exitCode = result.exitCode
      }, options)
    })

  return program
}

export function runCli(argv: readonly string[] = process.argv): void {
  createProgram({ exitOnUnhandledError: true }).parse(argv)
}

function isMainEntrypoint(): boolean {
  const entrypoint = process.argv[1]
  return entrypoint !== undefined && import.meta.url === pathToFileURL(resolve(entrypoint)).href
}

if (isMainEntrypoint()) runCli()
