#!/usr/bin/env node
import { Command } from "commander"
import { cleanXmlFiles } from "./commands/cleanXmlFiles.js"
import { exportConfigToXML } from "./commands/exportConfigToXml.js"
import { importConfigFromXml } from "./commands/importConfigFromXml.js"

const program = new Command()

program
  .name("clean-xml")
  .description("Очищает XML файлы пустых нод, сортирует и заменяет UUID на константу")
  .version("1.0.0")
  .argument("<input>", "входной файл или каталог")
  .argument("<output>", "выходной файл или каталог")
  .action((inputPath: string, outputPath: string) => {
    cleanXmlFiles(inputPath, outputPath)
  })

program
  .command("import")
  .description("Импорт конфигурации из XML файлов")
  .argument("<input>", "входящий каталог")
  .argument("<output>", "исходящий каталог")
  .action((inputPath: string, outputPath: string) => {
    importConfigFromXml(inputPath, outputPath)
  })

program
  .command("export")
  .description("Экспорт конфигурации в XML файлы")
  .argument("<input>", "входящий каталог")
  .argument("<output>", "исходящий каталог")
  .action((inputPath: string, outputPath: string) => {
    exportConfigToXML(inputPath, outputPath)
  })

program.parse()

// npm run dev /Users/nikita/git/small_full/xml/Catalogs /Users/nikita/git/erp_clean/xml/Catalogs
// cd /Users/nikita/git/nakidka-core/cli && npm run dev export /Users/nikita/git/erp_nkdk /Users/nikita/git/erp_clean/xml
// cd /Users/nikita/git/nakidka-core/cli && npm run dev import /Users/nikita/git/small_full/xml /Users/nikita/git/erp_nkdk

//npm run dev import /Users/nikita/git/ТестРаботы/xml /Users/nikita/git/ТестРаботы/nkdk
//npm run dev export /Users/nikita/git/ТестРаботы/nkdk /Users/nikita/git/ТестРаботы/xml
