import type { CandidateScan, FixtureSelection, Prompt, XmlCandidate } from "./types"

type ChooseFromListOptions<T> = {
  prompt: Prompt
  title: string
  items: T[]
  label?: (item: T) => string
  defaultIndex?: number
}

const skipMinimal = Symbol("skipMinimal")

type MinimalChoice = XmlCandidate | typeof skipMinimal

export async function chooseFromList<T>({
  prompt,
  title,
  items,
  label = String,
  defaultIndex = 0,
}: ChooseFromListOptions<T>): Promise<T> {
  if (items.length === 0) {
    throw new Error(`Нечего выбирать: список для «${title}» пуст`)
  }

  const safeDefaultIndex = isValidIndex(defaultIndex, items.length) ? defaultIndex : 0
  let message = buildQuestion(title, items, label, safeDefaultIndex)

  while (true) {
    const answer = (await prompt(message)).trim()

    if (answer === "") {
      return items[safeDefaultIndex]
    }

    const selectedIndex = Number(answer) - 1
    if (Number.isInteger(selectedIndex) && isValidIndex(selectedIndex, items.length)) {
      return items[selectedIndex]
    }

    message = `Введите число от 1 до ${items.length}.\n\n${buildQuestion(title, items, label, safeDefaultIndex)}`
  }
}

export async function chooseXmlDir(prompt: Prompt, availableXmlDirs: string[], defaultXmlDir: string): Promise<string> {
  const defaultIndex = availableXmlDirs.indexOf(defaultXmlDir)

  return chooseFromList({
    prompt,
    title: "Выберите XML-каталог",
    items: availableXmlDirs,
    defaultIndex: defaultIndex === -1 ? 0 : defaultIndex,
  })
}

export async function chooseFixtureSelection(prompt: Prompt, scan: CandidateScan): Promise<FixtureSelection> {
  const fullCandidates = scan.fullCandidates.length > 0 ? scan.fullCandidates : scan.candidates
  const full = await chooseFromList({
    prompt,
    title: "Выберите full.xml",
    items: fullCandidates,
    label: candidateLabel,
  })

  const hasMinimalCandidates = scan.minimalCandidates.length > 0
  const minimalCandidates = hasMinimalCandidates ? scan.minimalCandidates : scan.candidates
  const minimalChoices: MinimalChoice[] = [...minimalCandidates, skipMinimal]
  const minimal = await chooseFromList({
    prompt,
    title: "Выберите minimal.xml",
    items: minimalChoices,
    label: (choice) => (choice === skipMinimal ? "Пропустить minimal.xml" : candidateLabel(choice)),
    defaultIndex: hasMinimalCandidates ? 0 : minimalChoices.length - 1,
  })

  return {
    full,
    minimal: minimal === skipMinimal ? undefined : minimal,
  }
}

function buildQuestion<T>(title: string, items: T[], label: (item: T) => string, defaultIndex: number): string {
  const lines = items.map((item, index) => {
    const suffix = index === defaultIndex ? " [Enter]" : ""
    return `${index + 1}. ${label(item)}${suffix}`
  })

  return `${title}\n${lines.join("\n")}\n> `
}

function isValidIndex(index: number, length: number): boolean {
  return index >= 0 && index < length
}

function candidateLabel(candidate: XmlCandidate): string {
  return candidate.fileName
}
