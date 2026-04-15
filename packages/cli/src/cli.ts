#!/usr/bin/env node
import { Command } from "commander"
import { importConfiguration } from "./commands/import"
import { syncConfiguration } from "./commands/sync"
import { validateLinks } from "./commands/validateLinks"

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
  .command("validate")
  .description("Валидация ссылок в проекте — поиск битых ссылок (для CI/CD)")
  .argument("<project>", "путь к директории проекта")
  .action((projectPath: string) => {
    validateLinks(projectPath)
  })

program.parse()
