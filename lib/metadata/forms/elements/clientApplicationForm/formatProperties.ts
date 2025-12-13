import { ClientApplicationForm } from "./types"
import { stringify } from "yaml"

export function formatProperties(element: ClientApplicationForm): string {
  const yamlString = stringify(element, {
    indent: 2,
    lineWidth: 0,
  }).trim()
  return yamlString
}
