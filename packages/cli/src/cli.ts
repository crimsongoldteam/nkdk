#!/usr/bin/env node
import { Command } from "commander"
import { cleanFormFixturesXmlFiles, cleanXmlFiles } from "./commands/cleanXmlFiles"
import { exportConfigToXML } from "./commands/exportConfigToXml"
import { importConfigFromXml } from "./commands/importConfigFromXml"

const program = new Command()

program
  .command("clean-xml")
  .description("Очищает XML файлы пустых нод, сортирует и заменяет UUID на константу")
  .version("1.0.0")
  .argument("<input>", "входной файл или каталог")
  .argument("<output>", "выходной файл или каталог")
  .action((inputPath: string, outputPath: string) => {
    cleanXmlFiles(inputPath, outputPath)
  })

program
  .command("clean-form-fixture-xml")
  .description("Очищает XML файлы пустых нод, сортирует и заменяет UUID на константу")
  .version("1.0.0")
  .argument("<input>", "входной файл или каталог")
  .argument("<output>", "выходной файл или каталог")
  .action((inputPath: string, outputPath: string) => {
    cleanFormFixturesXmlFiles(inputPath, outputPath)
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

// cd /Users/nikita/git/nakidka-core/cli && npm run dev /Users/nikita/git/small_full/xml/Catalogs /Users/nikita/git/erp_clean/xml/Catalogs
// cd /Users/nikita/git/nakidka-core/cli && npm run dev export /Users/nikita/git/erp_nkdk /Users/nikita/git/erp_clean/xml
// cd /Users/nikita/git/nakidka-core/cli && npm run dev import /Users/nikita/git/small_full/xml /Users/nikita/git/erp_nkdk

//npm run dev import /Users/nikita/git/ТестРаботы/xml /Users/nikita/git/ТестРаботы/nkdk
//npm run dev export /Users/nikita/git/ТестРаботы/nkdk /Users/nikita/git/ТестРаботы/xml

// npm run dev  /Users/nikita/git/nakidka-core/packages/core/tempTest/Before/Form.xml /Users/nikita/git/nakidka-core/packages/core/tempTest/Before/Form.xml

// cd /Users/nikita/git/nakidka-core/cli && npm run dev clean-form-fixture-xml /Users/nikita/git/nakidka-core/packages/core/tests/fixtures/forms /Users/nikita/git/nakidka-core/packages/core/tests/fixtures/forms

// cd /Users/nikita/git/nakidka-core/cli && npm run dev clean-xml /Users/nikita/git/ТестРаботы/xml/CommonForms/ОбычнаяГруппа/Ext/Form.xml /Users/nikita/git/ТестРаботы/xml/CommonForms/ОбычнаяГруппа/Ext/Form.xml

//
