import chalk from "chalk"
import { existsSync } from "fs"
import { relative } from "path"
import { validateProject } from "~/metadata/validation/validateProject"

export const validate = (projectPath: string): void => {
  if (!existsSync(projectPath)) {
    console.error(chalk.red(`Директория не найдена: ${projectPath}`))
    process.exit(1)
  }

  const context = {
    version: "2.20",
    defaultLanguage: "ru",
  }

  const diagnostics = validateProject({ projectPath, context })

  // Сортировка по (filePath, line, col)
  diagnostics.sort((a, b) => {
    if (a.filePath !== b.filePath) return a.filePath.localeCompare(b.filePath)
    if (a.line !== b.line) return a.line - b.line
    return a.col - b.col
  })

  for (const d of diagnostics) {
    const relPath = relative(projectPath, d.filePath) || d.filePath
    const loc = `${relPath}:${d.line}:${d.col}`
    const msg = `${loc} [${d.source}] ${d.message}`
    if (d.severity === "error") {
      console.error(chalk.red(msg))
    } else {
      console.warn(chalk.yellow(msg))
    }
  }

  const hasErrors = diagnostics.some((d) => d.severity === "error")

  if (diagnostics.length === 0) {
    console.log(chalk.green("Ошибок не обнаружено"))
  }

  if (hasErrors) {
    process.exit(1)
  }
}
