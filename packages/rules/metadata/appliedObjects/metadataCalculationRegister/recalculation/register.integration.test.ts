import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import type { ConfigurationContextFromXML } from "@nkdk/runtime"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { syncRecalculationsFromXML } from "./register"

describe("recalculation external XML import", () => {
  it("writes the recalculation to the canonical project path", async () => {
    const root = await mkdtemp(join(tmpdir(), "nkdk-recalculation-import-"))
    try {
      const xmlDir = join(root, "xml", "CalculationRegisters")
      const sourceDir = join(xmlDir, "Регистр", "Recalculations")
      const nkdkDir = join(root, "project", "РегистрРасчета", "Регистр")
      await mkdir(sourceDir, { recursive: true })
      await writeFile(join(sourceDir, "Первый.xml"), "<Recalculation/>")

      await syncRecalculationsFromXML({
        context: {} as ConfigurationContextFromXML,
        rule: {} as PropertyRule,
        xmlDir,
        nkdkDir,
        name: "Регистр",
      })

      await expect(readFile(
        join(nkdkDir, "Перерасчеты", "Первый", "Свойства.xml"),
        "utf8",
      )).resolves.toBe("<Recalculation/>")
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
