import fs from "fs"
import { join } from "path"
import { ExternalFileEntry } from "~/metadata/context/types"
import { BasePropertyRule } from "~/metadata/orchestration/property/types"

type ExternalFileRule = Required<Pick<BasePropertyRule, "externalFile">>["externalFile"]

/**
 * Строит запись внешнего файла для свойства с опцией `externalFile`.
 *
 * @param rule - описание внешнего файла (`dir`, `extension`, `nameFrom`)
 * @param parentName - имя родительского объекта (например, имя реквизита формы)
 * @param value - содержимое файла
 * @returns запись `{ relativePath, content }` или `null`, если значение отсутствует
 */
export function buildExternalFileEntry(
  rule: ExternalFileRule,
  parentName: string,
  value: string | undefined
): ExternalFileEntry | null {
  if (value === undefined) return null
  const { dir, extension } = rule
  return {
    relativePath: `${dir}/${parentName}.${extension}`,
    content: value,
  }
}

/**
 * Читает содержимое внешнего файла для свойства с опцией `externalFile`.
 *
 * @param rule - описание внешнего файла (`dir`, `extension`, `nameFrom`)
 * @param parentName - имя родительского объекта (например, имя реквизита формы)
 * @param formDir - путь к каталогу формы
 * @returns содержимое файла или `undefined`, если файл/каталог отсутствует
 */
export function readExternalFile(
  rule: ExternalFileRule,
  parentName: string,
  formDir: string
): string | undefined {
  const { dir, extension } = rule
  const filePath = join(formDir, dir, `${parentName}.${extension}`)
  try {
    return fs.readFileSync(filePath, "utf-8")
  } catch {
    return undefined
  }
}
