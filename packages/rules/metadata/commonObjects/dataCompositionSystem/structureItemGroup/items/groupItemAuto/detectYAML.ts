export const detectGroupItemAutoYAML = (yaml: unknown) => {
  if (typeof yaml !== "string") return false
  return yaml.includes("[Авто]") || yaml.includes("([Авто])")
}
