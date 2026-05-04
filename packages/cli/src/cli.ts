#!/usr/bin/env node
import { Command } from "commander"
import { importConfiguration } from "./commands/import"
import { shortRoundTrip } from "./commands/shortRoundTrip"
import { syncConfiguration } from "./commands/sync"
import { updateGraph, updateGraphFile } from "./commands/updateGraph"

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
  .action((yamlDir: string, xmlDir: string) => {
    run(() => syncConfiguration(yamlDir, xmlDir))
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
  .action((projectPath: string, opts: { file?: string }) => {
    run(() => opts.file ? updateGraphFile(projectPath, opts.file) : updateGraph(projectPath))
  })

program.parse()
