export function validationComponentLayers(componentPath: string): readonly string[] {
  if (componentPath === "cf") return ["cf"]
  if (componentPath.startsWith("cfe/") && componentPath.length > "cfe/".length) {
    return [componentPath, "cf"]
  }
  throw new Error(`Недопустимый validation componentPath: ${componentPath}`)
}
