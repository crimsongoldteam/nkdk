import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { ClientFormApplication } from "./clientFormApplication"

describe("ClientFormApplication", () => {
  afterEach(() => {
    cleanup()
  })

  it("should render with title", () => {
    render(
      <ClientFormApplication
        elementType={FormElementType.ClientApplicationForm}
        title={{ items: { ru: "Test Title" } }}
        childItems={[]}
      />
    )

    expect(screen.getByText("Test Title")).toBeDefined()
  })
})
