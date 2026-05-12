import { describe, expect, it } from "vitest"
import { chooseFixtureSelection, chooseFromList, chooseXmlDir } from "./interactivePicker"
import type { CandidateScan, Prompt, XmlCandidate } from "./types"

function createPrompt(answers: string[]) {
  const questions: string[] = []
  const prompt: Prompt = async (question) => {
    questions.push(question)
    return answers.shift() ?? ""
  }

  return { prompt, questions }
}

function candidate(fileName: string): XmlCandidate {
  return {
    name: fileName.replace(/\.xml$/i, ""),
    fileName,
    path: `/dump/Documents/${fileName}`,
  }
}

function scan(overrides: Partial<CandidateScan> = {}): CandidateScan {
  const full = candidate("ЗаказВсеСвойства.xml")
  const minimal = candidate("ЗаказПоУмолчанию.xml")
  const regular = candidate("Заказ.xml")

  return {
    xmlDir: "Documents",
    sourceDir: "/dump/Documents",
    candidates: [regular, full, minimal],
    fullCandidates: [full],
    minimalCandidates: [minimal],
    ...overrides,
  }
}

describe("interactivePicker", () => {
  it("chooseFromList выбирает defaultIndex по Enter", async () => {
    const { prompt } = createPrompt([""])

    await expect(
      chooseFromList({
        prompt,
        title: "Выберите каталог",
        items: ["Catalogs", "Documents"],
        defaultIndex: 1,
      }),
    ).resolves.toBe("Documents")
  })

  it("chooseFromList принимает числовой выбор one-based", async () => {
    const { prompt } = createPrompt(["2"])

    await expect(
      chooseFromList({
        prompt,
        title: "Выберите XML",
        items: ["Первый", "Второй"],
      }),
    ).resolves.toBe("Второй")
  })

  it("chooseFromList после неверного ввода спрашивает снова", async () => {
    const { prompt, questions } = createPrompt(["не число", "3", "1"])

    await expect(
      chooseFromList({
        prompt,
        title: "Выберите XML",
        items: ["Первый", "Второй"],
      }),
    ).resolves.toBe("Первый")
    expect(questions).toHaveLength(3)
    expect(questions[1]).toContain("Введите число от 1 до 2")
  })

  it("chooseFromList сообщает понятную ошибку для пустого списка", async () => {
    const { prompt } = createPrompt([""])

    await expect(
      chooseFromList({
        prompt,
        title: "Выберите XML",
        items: [],
      }),
    ).rejects.toThrow("Нечего выбирать: список для «Выберите XML» пуст")
  })

  it("chooseFixtureSelection по Enter выбирает full и minimal по умолчанию", async () => {
    const { prompt } = createPrompt(["", ""])
    const sourceScan = scan()

    await expect(chooseFixtureSelection(prompt, sourceScan)).resolves.toEqual({
      full: sourceScan.fullCandidates[0],
      minimal: sourceScan.minimalCandidates[0],
    })
  })

  it("chooseFixtureSelection позволяет пропустить minimal.xml", async () => {
    const { prompt } = createPrompt(["", ""])
    const sourceScan = scan({ minimalCandidates: [] })

    await expect(chooseFixtureSelection(prompt, sourceScan)).resolves.toEqual({
      full: sourceScan.fullCandidates[0],
      minimal: undefined,
    })
  })

  it("chooseXmlDir выбирает defaultXmlDir по Enter, если он есть в списке", async () => {
    const { prompt } = createPrompt([""])

    await expect(chooseXmlDir(prompt, ["Catalogs", "Documents"], "Documents")).resolves.toBe(
      "Documents",
    )
  })
})
