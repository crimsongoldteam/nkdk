import { stringify } from "yaml"
import { ClientApplicationForm } from "./types"

export function formatProperties(element: ClientApplicationForm): string {
  const yamlString = stringify(element, {
    indent: 2,
    lineWidth: 0,
  }).trim()
  return yamlString
}
