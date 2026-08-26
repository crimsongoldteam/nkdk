import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { dirname, join } from "path"
import { beforeAll, describe, expect, it } from "vitest"

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
import { validatePendingChecks } from "../../../validation/projectValidationPendingChecks"
import { missingOwnerMetadataCache } from "../../../validation/tests/validationTestSupport"

describe("Recalculation project validation", () => {
  let registries: ReturnType<typeof createMetadataExecutionRegistrySets>
  let schemaCache: ReturnType<typeof createValidationSchemaCache>
  let rulesSnapshot: ReturnType<typeof createValidationRulesSnapshot>

  beforeAll(() => {
    registries = createMetadataExecutionRegistrySets(metadataRules)
    schemaCache = createValidationSchemaCache(mockContext)
    rulesSnapshot = createValidationRulesSnapshot(mockContext)
  })

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
        registries,
        () => {
          const file = resolveValidationProjectFile(projectDir, absolutePath)
          if (file === undefined) throw new Error("Recalculation project file was not resolved")
          return validateProjectFileFirstPass({
            projectDir,
            file,
            cache: createProjectYamlCache(),
            context: mockContext,
            schemaCache,
            rulesSnapshot,
          })
        },
      )

      if (result.state.kind !== "properties") throw new Error("Ожидались свойства перерасчёта")
      const found = validatePendingChecks({
        ownerCache: missingOwnerMetadataCache,
        checks: result.state.pendingChecks,
        resolveReference: () => "found",
      })
      expect(found.diagnostics).toContainEqual(expect.objectContaining({
        path: "/Измерения/Второе/ДанныеВедущихРегистров",
        source: "cross-file",
        message: expect.stringContaining("Ведущий"),
      }))
      expect(validatePendingChecks({
        ownerCache: missingOwnerMetadataCache,
        checks: result.state.pendingChecks,
        resolveReference: () => "missing",
      }).diagnostics).toEqual([])
    } finally {
      rmSync(projectDir, { recursive: true, force: true })
    }
  })
})
