import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "fs"
import { join } from "path"

/**
 * Рекурсивно ищет файл в каталоге и его подкаталогах
 * @param dir - каталог для поиска
 * @param fileName - имя файла для поиска
 * @returns путь к найденному файлу или null
 */
function findFileRecursively(dir: string, fileName: string): string | null {
  try {
    // Проверяем корневой каталог
    const rootFile = join(dir, fileName)
    if (existsSync(rootFile) && statSync(rootFile).isFile()) {
      return rootFile
    }

    // Проверяем подкаталоги
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subDir = join(dir, entry.name)
        const found = findFileRecursively(subDir, fileName)
        if (found) {
          return found
        }
      }
    }
  } catch (error) {
    // Игнорируем ошибки доступа
  }
  return null
}

/**
 * Копирует файлы ManagerModule.bsl и ObjectModule.bsl из исходного каталога в целевой
 * @param sourceDir - исходный каталог
 * @param targetDir - целевой каталог
 */
function copyModuleFiles(sourceDir: string, targetDir: string): void {
  const filesToCopy = ["ManagerModule.bsl", "ObjectModule.bsl"]

  filesToCopy.forEach((fileName) => {
    // Ищем файл рекурсивно в исходном каталоге
    const sourceFile = findFileRecursively(sourceDir, fileName)

    if (sourceFile) {
      const targetFile = join(targetDir, fileName)
      try {
        // Убеждаемся, что целевой каталог существует
        if (!existsSync(targetDir)) {
          mkdirSync(targetDir, { recursive: true })
        }
        copyFileSync(sourceFile, targetFile)
        console.log(`✓ Скопирован файл: ${fileName} из ${sourceFile} в ${targetDir}`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error(`❌ Ошибка при копировании файла ${fileName}: ${errorMessage}`)
      }
    } else {
      console.log(`⚠  Файл ${fileName} не найден в ${sourceDir}`)
    }
  })
}

/**
 * Перебирает все каталоги в папке Catalogs и копирует модули в целевой каталог
 * @param inputPath - путь к входящему каталогу
 * @param outputPath - путь к исходящему каталогу
 */
function processCatalogs(inputPath: string, outputPath: string): void {
  const catalogsPath = join(inputPath, "Catalogs")

  if (!existsSync(catalogsPath)) {
    console.error(`❌ Каталог Catalogs не найден: ${catalogsPath}`)
    return
  }

  try {
    const catalogDirs = readdirSync(catalogsPath, { withFileTypes: true })
    let processedCount = 0
    let errorCount = 0

    catalogDirs.forEach((dirent) => {
      if (dirent.isDirectory()) {
        const catalogName = dirent.name
        const sourceCatalogPath = join(catalogsPath, catalogName)
        const targetCatalogPath = join(outputPath, catalogName)

        try {
          // Создаем каталог в целевом каталоге, если его еще нет
          if (!existsSync(targetCatalogPath)) {
            mkdirSync(targetCatalogPath, { recursive: true })
            console.log(`✓ Создан каталог: ${catalogName} в ${outputPath}`)
          }

          // Копируем файлы модулей
          copyModuleFiles(sourceCatalogPath, targetCatalogPath)
          processedCount++
        } catch (error) {
          errorCount++
          const errorMessage = error instanceof Error ? error.message : String(error)
          console.error(`❌ Ошибка при обработке каталога ${catalogName}: ${errorMessage}`)
        }
      }
    })

    console.log(`\n✓ Обработано каталогов: ${processedCount}`)
    if (errorCount > 0) {
      console.error(`❌ Ошибок: ${errorCount}`)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`❌ Ошибка при чтении каталога Catalogs: ${errorMessage}`)
  }
}

/**
 * Импортирует конфигурацию: создает целевой каталог и копирует модули из Catalogs
 * @param inputPath - входящий каталог (содержит папку Catalogs)
 * @param outputPath - исходящий каталог (целевой каталог для копирования)
 */
export function importConfig(inputPath: string, outputPath: string): void {
  try {
    // Проверяем, что входящий каталог существует
    if (!existsSync(inputPath)) {
      console.error(`❌ Входящий каталог не найден: ${inputPath}`)
      process.exit(1)
      return
    }

    if (!statSync(inputPath).isDirectory()) {
      console.error(`❌ Входящий путь не является каталогом: ${inputPath}`)
      process.exit(1)
      return
    }

    // Создаем исходящий каталог, если его еще нет
    if (!existsSync(outputPath)) {
      mkdirSync(outputPath, { recursive: true })
      console.log(`✓ Создан исходящий каталог: ${outputPath}`)
    } else {
      console.log(`✓ Исходящий каталог уже существует: ${outputPath}`)
    }

    // Обрабатываем каталоги из папки Catalogs
    processCatalogs(inputPath, outputPath)
    console.log(`\n✓ Импорт завершен: ${inputPath} -> ${outputPath}`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`❌ Ошибка при импорте конфигурации: ${errorMessage}`)
    process.exit(1)
  }
}
