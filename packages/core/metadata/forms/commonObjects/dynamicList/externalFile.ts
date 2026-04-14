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
