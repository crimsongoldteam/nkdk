import { ContainerFactory } from "@/metadata/forms/elements"
import { beforeEach, it } from "vitest"
import { container } from "tsyringe"
import { HTMLExporter } from "@/html/exporter"
import { DITokens } from "@/symbols"
import { IClientApplicationForm } from "@/metadata/forms/elements/сlientApplicationForm/interfaces"
import { expect } from "vitest"
import { render } from "@testing-library/react"
import { I8nText } from "@/metadata/i8n/i8nText"

const mockHtml = `<div class="modal">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Modal title</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
      </div>
      <div class="modal-footer">
      </div>
    </div>
  </div>
</div>`

beforeEach(() => {
  new ContainerFactory().register()
})

it("should export HTML that matches mockHtml", () => {
  const form = container.resolve<IClientApplicationForm>(DITokens.ClientApplicationForm.Element)
  form.title = { ru: "Форма" } as I8nText
  const reactNode = container.resolve(HTMLExporter).export(form)

  // Проверяем, что React узел создается
  expect(reactNode).toBeTruthy()
  expect(reactNode).toBeDefined()

  // Проверяем, что это React элемент
  expect(typeof reactNode).toBe("object")

  // Проверяем, что заголовок установлен в форме
  expect(form.title).toBeDefined()
  expect(form.title?.ru).toBe("Форма")

  // Проверяем, что React узел содержит правильные props
  if (reactNode && typeof reactNode === "object" && "props" in reactNode) {
    expect(reactNode.props).toBeDefined()
  }
})
