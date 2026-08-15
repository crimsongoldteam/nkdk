import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { dirname, join } from "path"
import { describe, expect, it } from "vitest"

import { mockContext } from "../../../../tests/mockContext"
import { metadataRules } from "../../../composition/metadataRules"
import {
  createMetadataExecutionRegistrySets,
  withMetadataExecutionRegistrySets,
} from "../../../composition/metadataExecutionContext"
import { resolveValidationProjectFile } from "../../../validation/projectFiles"
import { createProjectYamlCache } from "../../../validation/projectYamlCache"
import {
  createValidationSchemaCache,
  validateProjectFileFirstPass,
} from "../../../validation/projectValidationPasses"
import { createValidationRulesSnapshot } from "../../../validation/rulesSnapshot"

describe("Recalculation project validation", () => {
  it("reports an incomplete leading-register link matrix", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-recalculation-validation-"))
    try {
      const projectPath = "РегистрРасчета/Основной/Перерасчеты/Проверка/Свойства.yaml"
      const absolutePath = join(projectDir, projectPath)
      mkdirSync(dirname(absolutePath), { recursive: true })
      writeFileSync(absolutePath, [
        "Измерения:",
        "  Первое:",
        "    ИзмерениеРегистра: Первое",
        "    ДанныеВедущихРегистров:",
        "      - Первое",
        "      - РегистрРасчета.Ведущий.Измерение.Ключ",
        "  Второе:",
        "    ИзмерениеРегистра: Второе",
        "    ДанныеВедущихРегистров:",
        "      - Второе",
      ].join("\n"))

      const result = withMetadataExecutionRegistrySets(
        createMetadataExecutionRegistrySets(metadataRules),
        () => {
          const file = resolveValidationProjectFile(projectDir, absolutePath)
          if (file === undefined) throw new Error("Recalculation project file was not resolved")
          return validateProjectFileFirstPass({
            projectDir,
            file,
            cache: createProjectYamlCache(),
            context: mockContext,
            schemaCache: createValidationSchemaCache(mockContext),
            rulesSnapshot: createValidationRulesSnapshot(mockContext),
          })
        },
      )

      expect(result.diagnostics).toContainEqual(expect.objectContaining({
        path: "/Измерения/Второе/ДанныеВедущихРегистров",
        source: "cross-file",
        message: expect.stringContaining("Ведущий"),
      }))
    } finally {
      rmSync(projectDir, { recursive: true, force: true })
    }
  })
})
