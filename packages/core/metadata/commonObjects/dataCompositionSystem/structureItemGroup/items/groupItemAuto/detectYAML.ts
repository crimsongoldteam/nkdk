export const detectGroupItemAutoYAML = (yaml: string) => {
  return yaml.includes("[Авто]") || yaml.includes("([Авто])")
}
