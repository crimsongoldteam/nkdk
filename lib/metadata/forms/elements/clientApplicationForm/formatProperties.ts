import { TClientApplicationForm } from "./types"
import * as yaml from "js-yaml"

export function formatProperties(element: TClientApplicationForm): string {
  const yamlString = yaml
    .dump(element, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false,
    })
    .trim()
  return yamlString
}
