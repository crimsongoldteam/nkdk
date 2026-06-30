import "./types"
import { existsSync } from "fs"
import { join } from "path"
import {
  registerProjectNamedResourceResolver,
  type MetadataResolveResult,
} from "~/metadata/validation/projectMetadataResolverRegistry"

registerProjectNamedResourceResolver("CommonPicture", ({ projectDir, name }) => {
  const filePath = join(projectDir, "ОбщаяКартинка", name, "Свойства.yaml")
  return existsSync(filePath)
    ? { ok: true, filePath }
    : referenceError(filePath, `Не найдена общая картинка "ОбщаяКартинка.${name}"`)
})

function referenceError(filePath: string, message: string): MetadataResolveResult {
  return {
    ok: false,
    diagnostics: [{ filePath, line: 1, col: 1, source: "reference", severity: "error", message }],
  }
}
