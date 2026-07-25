import { isAbsolute } from "node:path"

export type ComponentAddress =
  | { readonly kind: "configuration" }
  | { readonly kind: "configurationExtension"; readonly name: string }
  | { readonly kind: "externalReport"; readonly name: string }
  | { readonly kind: "externalDataProcessor"; readonly name: string }

export function componentPath(address: ComponentAddress): string {
  if (address.kind === "configuration") return "cf"

  assertComponentName(address.name)
  const root = {
    configurationExtension: "cfe",
    externalReport: "erf",
    externalDataProcessor: "epf",
  }[address.kind]
  return `${root}/${address.name}`
}

function assertComponentName(name: string): void {
  if (name.length === 0 || name === "." || name === ".." || name.includes("/") || name.includes("\\") || isAbsolute(name)) {
    throw new Error(`Недопустимое имя компонента: ${name}`)
  }
}
