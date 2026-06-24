import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { listXmlDirs, scanCandidates } from "./candidateScanner"

const tempRoots: string[] = []

async function createTempDump() {
  const dumpRoot = await mkdtemp(join(tmpdir(), "fixture-wizard-dump-"))
  tempRoots.push(dumpRoot)
  return dumpRoot
}

describe("candidateScanner", () => {
  afterEach(async () => {
    await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
  })

  it("listXmlDirs возвращает только директории верхнего уровня", async () => {
    const dumpRoot = await createTempDump()
    await mkdir(join(dumpRoot, "Documents"))
    await mkdir(join(dumpRoot, "Catalogs"))
    await writeFile(join(dumpRoot, "Configuration.xml"), "<root />", "utf-8")
    await writeFile(join(dumpRoot, ".DS_Store"), "", "utf-8")

    await expect(listXmlDirs(dumpRoot)).resolves.toEqual(["Catalogs", "Documents"])
  })

  it("scanCandidates классифицирует XML-кандидатов и игнорирует служебные и вложенные файлы", async () => {
    const dumpRoot = await createTempDump()
    const documentsDir = join(dumpRoot, "Documents")
    await mkdir(join(documentsDir, "Nested"), { recursive: true })
    await writeFile(join(documentsDir, "ЗаказВсеСвойства.xml"), "<root />", "utf-8")
    await writeFile(join(documentsDir, "ЗаказПоУмолчанию.xml"), "<root />", "utf-8")
    await writeFile(join(documentsDir, "Заказ.xml"), "<root />", "utf-8")
    await writeFile(join(documentsDir, "ЗаказВерхнийРегистр.XML"), "<root />", "utf-8")
    await writeFile(join(documentsDir, ".DS_Store"), "", "utf-8")
    await writeFile(join(documentsDir, "readme.txt"), "", "utf-8")
    await writeFile(join(documentsDir, "Nested/Вложенный.xml"), "<root />", "utf-8")

    await expect(scanCandidates(dumpRoot, "Documents")).resolves.toEqual({
      xmlDir: "Documents",
      sourceDir: documentsDir,
      candidates: [
        {
          name: "Заказ",
          fileName: "Заказ.xml",
          path: join(documentsDir, "Заказ.xml"),
        },
        {
          name: "ЗаказВерхнийРегистр",
          fileName: "ЗаказВерхнийРегистр.XML",
          path: join(documentsDir, "ЗаказВерхнийРегистр.XML"),
        },
        {
          name: "ЗаказВсеСвойства",
          fileName: "ЗаказВсеСвойства.xml",
          path: join(documentsDir, "ЗаказВсеСвойства.xml"),
        },
        {
          name: "ЗаказПоУмолчанию",
          fileName: "ЗаказПоУмолчанию.xml",
          path: join(documentsDir, "ЗаказПоУмолчанию.xml"),
        },
      ],
      fullCandidates: [
        {
          name: "ЗаказВсеСвойства",
          fileName: "ЗаказВсеСвойства.xml",
          path: join(documentsDir, "ЗаказВсеСвойства.xml"),
        },
      ],
      minimalCandidates: [
        {
          name: "ЗаказПоУмолчанию",
          fileName: "ЗаказПоУмолчанию.xml",
          path: join(documentsDir, "ЗаказПоУмолчанию.xml"),
        },
      ],
    })
  })

  it("scanCandidates сообщает понятную ошибку, если XML-каталог не найден", async () => {
    const dumpRoot = await createTempDump()

    await expect(scanCandidates(dumpRoot, "Documents")).rejects.toThrow(
      "XML-каталог Documents не найден в выгрузке",
    )
  })
})
