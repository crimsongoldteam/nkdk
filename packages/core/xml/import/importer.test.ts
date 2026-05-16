import { describe, expect, it } from "vitest"
import { importContentFromXML } from "./importer"

describe("importContentFromXML", () => {
  it("preserves numeric-looking text nodes as strings", () => {
    const xml = `<root><Presentation><v8:item><v8:lang>ru</v8:lang><v8:content>2.0</v8:content></v8:item></Presentation></root>`

    const result = importContentFromXML<{
      root: {
        Presentation: {
          "v8:item": {
            "v8:lang": string
            "v8:content": string
          }
        }
      }
    }>(xml)

    expect(result.root.Presentation["v8:item"]["v8:content"]).toBe("2.0")
    expect(typeof result.root.Presentation["v8:item"]["v8:content"]).toBe("string")
  })

  it("drops xsi:nil attributes unless preserveXsiNil is enabled", () => {
    const xml = `<Root><Settings><Value xsi:nil="true"/></Settings><Outside><Value xsi:nil="true"/></Outside></Root>`

    const result = importContentFromXML<{
      Root: {
        Settings: { Value?: { "_xsi:nil": string } }
        Outside: { Value?: { "_xsi:nil": string } }
      }
    }>(xml)

    expect(result.Root.Settings.Value).toBeUndefined()
    expect(result.Root.Outside.Value).toBeUndefined()

    const preserved = importContentFromXML<{
      Root: {
        Settings: { Value: { "_xsi:nil": string } }
        Outside: { Value: { "_xsi:nil": string } }
      }
    }>(xml, { preserveXsiNil: true })

    expect(preserved.Root.Settings.Value).toEqual({ "_xsi:nil": "true" })
    expect(preserved.Root.Outside.Value).toEqual({ "_xsi:nil": "true" })
  })
})
