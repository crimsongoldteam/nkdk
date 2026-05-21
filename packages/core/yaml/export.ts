import { stringify } from "yaml"

const removeDocumentFinalLineEnding = (yaml: string): string => {
  if (!yaml.endsWith("\n")) return yaml
  if (yaml.endsWith("|\n") || yaml.endsWith("|+\n") || yaml.endsWith("|-\n")) return yaml
  return yaml.slice(0, -1)
}

export const exportToYAML = <T>(data: T): string => {
  const yaml = stringify(data, {
    indent: 2,
    lineWidth: 0,
    keepUndefined: true,
    nullStr: "",
  })
  return removeDocumentFinalLineEnding(yaml)
}
