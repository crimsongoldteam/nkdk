#!/usr/bin/env node
import { Command } from "commander"
import { importConfiguration } from "./commands/import"
import { deleteMigration, generateMigration, renameMigration } from "./commands/migration"
import { printJSONSchema } from "./commands/schema"
import { shortRoundTrip } from "./commands/shortRoundTrip"
import { syncConfiguration } from "./commands/sync"
import { updateGraph, updateGraphFile } from "./commands/updateGraph"
import { watch } from "./commands/watch"

function run(fn: () => Promise<void>): void {
  fn().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err)
    process.stderr.write(msg + "\n")
    if (process.env["DEBUG"] === "1" && err instanceof Error && err.stack) {
      process.stderr.write(err.stack + "\n")
    }
    process.exit(1)
  })
}

const program = new Command()

program
  .command("import")
  .description("Импорт конфигурации из XML в YAML (XML → YAML)")
  .argument("<xml-dir>", "путь к каталогу XML-выгрузки")
  .argument("<yaml-dir>", "путь к каталогу YAML-проекта")
  .action((xmlDir: string, yamlDir: string) => {
    run(() => importConfiguration(xmlDir, yamlDir))
  })

program
  .command("sync")
  .description("Синхронизация конфигурации из YAML в XML (YAML → XML)")
  .argument("<yaml-dir>", "путь к каталогу YAML-проекта")
  .argument("<xml-dir>", "путь к каталогу XML-выгрузки")
  .option("--reference <xml-dir>", "путь к XML-каталогу для чтения reference-данных")
  .action((yamlDir: string, xmlDir: string, opts: { reference?: string }) => {
    run(() => syncConfiguration(yamlDir, xmlDir, { referenceDir: opts.reference }))
  })

program
  .command("short-round-trip-test")
  .description("Проверка round-trip XML → модель → XML (без YAML-слоя)")
  .argument("<xml-dir>", "путь к каталогу XML-выгрузки")
  .action((xmlDir: string) => {
    run(() => shortRoundTrip(xmlDir))
  })

program
  .command("update-graph")
  .description("Обновить граф метаданных в FalkorDB по YAML-проекту")
  .argument("<path>", "путь к корню YAML-проекта")
  .option("--file <filePath>", "обновить только один файл проекта")
  .option("--replace", "полностью заменить граф быстрым CREATE-путём")
  .option("--bulk", "использовать экспериментальный GRAPH.BULK replace-путь; требует --replace")
  .action((projectPath: string, opts: { file?: string; replace?: boolean; bulk?: boolean }) => {
    run(() => opts.file
      ? updateGraphFile(projectPath, opts.file)
      : updateGraph(projectPath, { replace: opts.replace === true, bulk: opts.bulk === true }))
  })

program
  .command("watch")
  .description("Следить за YAML-проектом и инкрементально обновлять граф")
  .argument("<path>", "путь к корню YAML-проекта")
  .action((projectPath: string) => {
    run(() => watch(projectPath))
  })

program
  .command("schema")
  .description("Показать JSON Schema для YAML-файла проекта или имени схемы")
  .argument("<target>", "путь к YAML-файлу проекта или имя схемы")
  .option("--project <yamlDir>", "путь к корню YAML-проекта")
  .option("--inline", "развернуть составные подсхемы в одном JSON")
  .action((target: string, opts: { project?: string; inline?: boolean }) => {
    run(() => printJSONSchema(target, opts))
  })

program
  .command("rename")
  .description("Создать миграцию переименования")
  .argument("<yaml-dir>", "путь к каталогу YAML-проекта")
  .argument("<path>", "полный путь элемента")
  .argument("<new-name>", "новое локальное имя")
  .action((yamlDir: string, path: string, newName: string) => {
    run(() => Promise.resolve(renameMigration(yamlDir, path, newName)))
  })

program
  .command("delete")
  .description("Создать миграцию удаления")
  .argument("<yaml-dir>", "путь к каталогу YAML-проекта")
  .argument("<path>", "полный путь элемента")
  .action((yamlDir: string, path: string) => {
    run(() => Promise.resolve(deleteMigration(yamlDir, path)))
  })

program
  .command("generate-migration")
  .description("Создать миграцию для неоднозначных структурных изменений")
  .argument("<yaml-dir>", "путь к каталогу YAML-проекта")
  .argument("<xml-dir>", "путь к каталогу XML-выгрузки")
  .option("--dry-run", "показать конфликты без записи файла")
  .action((yamlDir: string, xmlDir: string, opts: { dryRun?: boolean }) => {
    run(async () => {
      const result = await generateMigration({ yamlDir, xmlDir, dryRun: opts.dryRun === true })
      if (result.conflicts.length > 0) {
        for (const conflict of result.conflicts) {
          process.stdout.write(
            `${conflict.levelPath}: удалено [${conflict.deleted.join(", ")}], добавлено [${conflict.added.join(", ")}]\n`,
          )
        }
      }
      if (result.exitCode !== 0) process.exitCode = result.exitCode
    })
  })

program.parse()
