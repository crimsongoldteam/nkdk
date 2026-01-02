import { stringify } from "yaml"

export const exportToYAML = <T>(data: T): string => {
  return stringify(data, {
    indent: 2,
    lineWidth: 0,
  }).trim()
}
