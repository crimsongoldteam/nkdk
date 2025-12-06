import { TClientApplicationForm } from "./types"
import { stringify } from "yaml"

export function formatProperties(element: TClientApplicationForm): string {
  const yamlString = stringify(element, {
    indent: 2,
    lineWidth: 0,
  }).trim()
  return yamlString
}
