#!/usr/bin/env node
import { Command } from "commander"
import { cleanXmlFiles } from "./commands/cleanXmlFiles.js"
import { importConfigFromXml } from "./commands/importConfigFromXml.js"

const program = new Command()

program
  .name("clean-xml")
  .description("CLI инструмент для обработки XML файлов и каталогов")
  .version("1.0.0")
  .argument("<input>", "входной файл или каталог")
  .argument("<output>", "выходной файл или каталог")
  .action((inputPath: string, outputPath: string) => {
    cleanXmlFiles(inputPath, outputPath)
  })

program
  .command("import")
  .description("Импорт конфигурации: копирует модули из каталога Catalogs в целевой каталог")
  .argument("<input>", "входящий каталог (содержит папку Catalogs)")
  .argument("<output>", "исходящий каталог (целевой каталог для копирования)")
  .action((inputPath: string, outputPath: string) => {
    importConfigFromXml(inputPath, outputPath)
  })

program.parse()
