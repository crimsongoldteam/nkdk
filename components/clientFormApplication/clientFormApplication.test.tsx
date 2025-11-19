import { render, screen, cleanup } from "@testing-library/react"
import { expect, it, describe, afterEach } from "vitest"
import { ClientFormApplication } from "./clientFormApplication"

describe("ClientFormApplication", () => {
  afterEach(() => {
    cleanup()
  })

  it("should render with title", () => {
    render(<ClientFormApplication title="Test Title" childItems={[]} />)

    expect(screen.getByText("Test Title")).toBeDefined()
  })
})
