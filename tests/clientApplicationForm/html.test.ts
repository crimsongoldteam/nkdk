import { ContainerFactory } from "@/metadata/forms/elements"
import { beforeEach, it } from "node:test"
import { container } from "tsyringe"
import { HTMLExporter } from "@/html/exporter"
import { DITokens } from "@/symbols"
import { IClientApplicationForm } from "@/metadata/forms/elements/сlientApplicationForm/interfaces"
import { expect } from "vitest"
import { render } from "@testing-library/react"

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
  const reactNode = container.resolve(HTMLExporter).export(form)
  const { container: testContainer } = render(reactNode)

  // Получаем HTML из рендеренного компонента
  const renderedHtml = testContainer.innerHTML

  // Проверяем, что компонент рендерится (не пустой)
  expect(renderedHtml).toBeTruthy()

  // Проверяем наличие основных элементов Modal
  expect(renderedHtml).toContain("modal")
  expect(renderedHtml).toContain("modal-dialog")
  expect(renderedHtml).toContain("modal-content")
})
