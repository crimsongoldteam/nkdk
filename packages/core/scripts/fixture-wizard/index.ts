import { createInterface } from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { listXmlDirs, scanCandidates } from "./candidateScanner"
import { buildCopyPlan, copyFixtures, formatCopyPlan, formatTestCommands } from "./fixtureCopier"
import { chooseFixtureSelection, chooseXmlDir } from "./interactivePicker"
import { resolveMetadataTarget } from "./targetResolver"
import type { CopyReport, Prompt } from "./types"

type Output = {
  write(message: string): unknown
}

export type FixtureWizardParams = {
  metadataItem: string
  dumpRoot: string
  projectRoot?: string
  prompt: Prompt
  output?: Output
}

const usage =
  "Использование: pnpm --filter @nkdk/core exec tsx scripts/fixture-wizard/index.ts <metadataItem> <dumpRoot>\n" +
  "Пример: pnpm --filter @nkdk/core exec tsx scripts/fixture-wizard/index.ts metadataCatalog /Users/nikita/git/roundTripElements"

const yesAnswers = new Set(["y", "yes", "д", "да"])

export async function runFixtureWizard({
  metadataItem,
  dumpRoot,
  projectRoot = resolveProjectRoot(),
  prompt,
  output = process.stdout,
}: FixtureWizardParams): Promise<void> {
  const target = await resolveMetadataTarget(projectRoot, metadataItem)
  const availableXmlDirs = await listXmlDirs(dumpRoot)
  const xmlDir = await chooseXmlDir(prompt, availableXmlDirs, target.xmlDir ?? availableXmlDirs[0] ?? "")
  const scan = await scanCandidates(dumpRoot, xmlDir)

  if (scan.candidates.length === 0) {
    throw new Error(`В ${scan.sourceDir} нет XML-файлов верхнего уровня`)
  }

  const selection = await chooseFixtureSelection(prompt, scan)
  const plan = await buildCopyPlan({
    target: { ...target, xmlDir },
    sourceXmlDir: scan.sourceDir,
    selection,
  })

  output.write(`${formatCopyPlan(plan)}\n`)

  const confirmed = yesAnswers.has((await prompt("Выполнить копирование? [y/N]")).trim().toLowerCase())

  if (!confirmed) {
    output.write("Копирование отменено. Файлы не изменены.\n")
    return
  }

  const report = await copyFixtures(plan)
  output.write("Готово.\n")
  writeReport(output, report)
  output.write("Точечные проверки:\n")

  for (const command of formatTestCommands(metadataItem)) {
    output.write(`- ${command}\n`)
  }
}

async function main(): Promise<void> {
  const [, , metadataItem, dumpRoot] = process.argv

  if (metadataItem === undefined || dumpRoot === undefined) {
    process.stdout.write(`${usage}\n`)
    process.exitCode = 1
    return
  }

  const { prompt, close } = await createCliPrompt()

  try {
    await runFixtureWizard({
      metadataItem,
      dumpRoot,
      prompt,
    })
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  } finally {
    close()
  }
}

async function createCliPrompt(): Promise<{ prompt: Prompt; close: () => void }> {
  if (input.isTTY) {
    const readline = createInterface({ input, output })
    return {
      prompt: (question) => readline.question(question),
      close: () => readline.close(),
    }
  }

  const chunks: Buffer[] = []
  for await (const chunk of input) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  const answers = Buffer.concat(chunks).toString("utf-8").split(/\r?\n/)

  return {
    prompt: async (question) => {
      output.write(question)
      return answers.shift() ?? ""
    },
    close: () => undefined,
  }
}

function writeReport(output: Output, report: CopyReport): void {
  writeList(output, "Созданы:", report.created)
  writeList(output, "Обновлены:", report.updated)
  writeList(output, "Проверены:", report.verified)
}

function writeList(output: Output, title: string, values: string[]): void {
  output.write(`${title}\n`)

  if (values.length === 0) {
    output.write("- нет\n")
    return
  }

  for (const value of values) {
    output.write(`- ${value}\n`)
  }
}

function resolveProjectRoot(): string {
  const cwd = process.cwd()

  if (cwd.endsWith("packages/core")) {
    return resolve(cwd, "../..")
  }

  return cwd
}

function isCliEntrypoint(): boolean {
  const entrypoint = process.argv[1]

  return entrypoint !== undefined && import.meta.url === pathToFileURL(resolve(entrypoint)).href
}

if (isCliEntrypoint()) {
  void main()
}
