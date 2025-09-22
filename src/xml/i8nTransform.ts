import { I8nText } from "@/metadata/forms/interfaces"

export function i8nTransform(i8nText: I8nText | undefined): any {
  if (!i8nText) return undefined

  const titleItems = Object.entries(i8nText).map(([lang, content]) => ({
    "v8:lang": lang,
    "v8:content": content,
  }))
  return { "v8:item": titleItems }
}
