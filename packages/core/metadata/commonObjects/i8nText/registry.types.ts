import type { I8nText, I8nTextYAML } from "./types"

declare module "../../orchestration/property/registry" {
  interface PropertyTypeRegistry {
    I8nText: {
      item: I8nText
      enterprise: string
      yaml: I8nTextYAML
    }
  }
}
