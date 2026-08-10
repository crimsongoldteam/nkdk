import { readFile } from "fs/promises"
import { parseWithJsYaml } from "./jsYamlParser"

export const importFromYAML = <T>(data: string): T => {
  const parsed = parseWithJsYaml(data)
  if (parsed.syntaxErrors.length > 0) {
    const first = parsed.syntaxErrors[0]
    throw new Error(`${first.message} (${first.line}:${first.col})`)
  }
  return parsed.data as T
}

export const importFromYAMLFile = async <T>(filePath: string): Promise<T> => {
  const data = await readFile(filePath, "utf-8")
  return importFromYAML(data)
}
