# Historical Borrowed Form Implicit Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Материализовать и помечать `!xml/invalid` неявный путь элемента, который сохранился только в историческом `BaseForm`, но использует не добавленный в рабочую форму реквизит текущей `cf`.

**Architecture:** Импортный финализатор уже строит единый `FormDataPathContext` по рабочей форме, текущей `cf` и сохранённой основе. Он должен отличать элемент, существующий в текущей `cf`, от элемента, заимствованного только по историческому `BaseForm`: первый продолжает наследовать путь, для второго отсутствующий путь материализуется как диагностическая граница и затем получает существующий `!xml/invalid` в общем конвейере импортных решений. Валидатор и предикат необходимости основы не меняются.

**Tech Stack:** TypeScript 7, Vitest 4, YAML, XML, LMDB ProjectState, NKDK MCP.

**Spec:** `docs/superpowers/specs/2026-09-02-borrowed-form-import-anomaly-regression-design.md`

## Global Constraints

- Элемент только из исторического `BaseForm` не получает права использовать реквизит текущей `cf`, отсутствующий в `Реквизиты` рабочей формы.
- Элемент, который всё ещё существует в текущей `cf`, сохраняет действующее наследование пути без явного рабочего реквизита.
- Импорт не добавляет реквизит формы автоматически и применяет только существующий `!xml/invalid`; `!xml/raw` не расширяется.
- Значимо отличающаяся `БазоваяФорма.yaml` сохраняется; восстановимая основа не сохраняется.
- Существующие XML-фикстуры не изменяются; производный XML строится программно внутри интеграционного теста.
- Production-код не получает условий по именам `Список`, `ПоказыватьОписаниеИлиЗадачи`, физическим путям или metadata-типам.
- Нейтральные metadata-слои и `.agents/architecture.md` не изменяются.
- Реальный контрольный импорт пишет только во временный проект; `C:/git/sed_nkdk` и `C:/git/temp` используются только для чтения.
- База проверки новых дублей: `a850d8d05`.

---

### Task 1: Материализация пути исторически заимствованного элемента

**Files:**
- Modify: `packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.test.ts`
- Modify: `packages/rules/metadata/importFromXml/importConfigurationExtension.integration.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.ts:20-35,413-454,156-173`

**Interfaces:**
- Consumes: `prepareFormDataPathContextFromYAML(...)`, существующие `materializeInheritedRootFormDataPaths(...)` и `applyImportedIssueDecisions`.
- Produces: внутренний признак `FormElementDataPathState.presentInCurrentConfiguration?: true` и прежняя сигнатура `materializeInheritedRootFormDataPaths(params): readonly MaterializedInheritedDataPath[]`; функция дополнительно материализует путь borrowed-элемента, отсутствующего в текущей `cf`, но найденного в сохранённой основе.

- [ ] **Step 1: Добавить падающую unit-проверку исторической основы**

В существующий `describe("prepareFormDataPathContextFromYAML", ...)` добавить тест:

```ts
it("материализует путь элемента только из исторической основы через унаследованный реквизит", () => {
  const yaml: ClientApplicationFormYAML = {
    Элементы: { ИсторическоеПоле: { Вид: "ПолеВвода" } },
  }
  const context = prepareFormDataPathContextFromYAML({
    yaml,
    currentConfigurationFormYaml: {
      Реквизиты: {
        Объект: { Тип: "CatalogObject.Товары", ОсновнойРеквизит: "Истина" },
      },
    },
    savedBaseFormYaml: {
      Элементы: { ИсторическоеПоле: { Вид: "ПолеВвода" } },
    },
    ownerCache: catalogOwnerCache(),
  })

  expect(context.elementsByName.get("ИсторическоеПоле")).toMatchObject({
    origin: "borrowed",
    candidateRootOrigin: "inherited",
  })
  expect(context.elementsByName.get("ИсторическоеПоле")?.presentInCurrentConfiguration).toBeUndefined()
  materializeInheritedRootFormDataPaths({ yaml, context })

  expect(yaml.Элементы.ИсторическоеПоле.ПутьКДанным).toBe("Объект.ИсторическоеПоле")
})
```

Усилить существующий тест `использует текущую cf для основного реквизита, borrowed-имён и пути таблицы`: проверить у `Код` `presentInCurrentConfiguration: true`, вызвать `materializeInheritedRootFormDataPaths({ yaml, context })` и проверить, что свойство `ПутьКДанным` не появилось. Это защищает разрешённое наследование от текущей `cf`.

- [ ] **Step 2: Добавить падающую интеграционную проверку полного импорта**

В `importConfigurationExtension.integration.test.ts` добавить четвёртую вложенную форму `ФормаИсторическийЭлемент`, не изменяя XML-фикстуры на диске:

1. В `importBaseConfiguration` добавить имя формы в `ChildObjects` и массив создаваемых форм. Её текущая форма `cf` должна содержать только `baseFormAttributesXml()` и не содержать `ИсторическоеПоле`.
2. После `addFormWithRedundantBase(inputDir)` вызвать новый helper `addFormWithHistoricalElement(inputDir)`.
3. Helper копирует созданную `ФормаБезОсновы`, заменяет имя и оба UUID на
   `12121212-1212-4121-8121-121212121212` и
   `13131313-1313-4131-8131-131313131313`, добавляет `ИсторическоеПоле` без
   `DataPath` во внешние `ChildItems`, а перед `</Form>` добавляет историческую
   основу.

Использовать следующий helper; он опирается только на уже существующие в файле
`replaceExactlyOnce` и `fs.cpSync`:

```ts
function historicalFieldXml(indent: string): string[] {
  return [
    `${indent}<InputField name="ИсторическоеПоле" id="30">`,
    `${indent}\t<ContextMenu name="ИсторическоеПолеКонтекстноеМеню" id="31"/>`,
    `${indent}\t<ExtendedTooltip name="ИсторическоеПолеРасширеннаяПодсказка" id="32"/>`,
    `${indent}</InputField>`,
  ]
}

function addFormWithHistoricalElement(inputDir: string): void {
  const formsDir = join(inputDir, "Catalogs", "СправочникПолный", "Forms")
  const sourceMetadataPath = join(formsDir, "ФормаБезОсновы.xml")
  const targetMetadataPath = join(formsDir, "ФормаИсторическийЭлемент.xml")
  const sourceFormDir = join(formsDir, "ФормаБезОсновы")
  const targetFormDir = join(formsDir, "ФормаИсторическийЭлемент")
  fs.copyFileSync(sourceMetadataPath, targetMetadataPath)
  fs.cpSync(sourceFormDir, targetFormDir, { recursive: true })
  replaceExactlyOnce(
    targetMetadataPath,
    "99999999-9999-4999-8999-999999999999",
    "12121212-1212-4121-8121-121212121212",
  )
  replaceExactlyOnce(
    targetMetadataPath,
    "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "13131313-1313-4131-8131-131313131313",
  )
  replaceExactlyOnce(
    targetMetadataPath,
    "<Name>ФормаБезОсновы</Name>",
    "<Name>ФормаИсторическийЭлемент</Name>",
  )

  const targetFormPath = join(targetFormDir, "Ext", "Form.xml")
  replaceExactlyOnce(
    targetFormPath,
    "\t</ChildItems>\n\t<Attributes>",
    `${historicalFieldXml("\t\t").join("\n")}\n\t</ChildItems>\n\t<Attributes>`,
  )
  const baseForm = [
    "\t<BaseForm version=\"2.20\">",
    "\t\t<AutoCommandBar name=\"ФормаКоманднаяПанель\" id=\"-1\"/>",
    "\t\t<ChildItems>",
    ...historicalFieldXml("\t\t\t"),
    "\t\t</ChildItems>",
    "\t\t<Attributes/>",
    "\t</BaseForm>",
  ].join("\n")
  replaceExactlyOnce(targetFormPath, "</Form>", `${baseForm}\n</Form>`)
  replaceExactlyOnce(
    join(inputDir, "Catalogs", "СправочникПолный.xml"),
    "\t\t\t<Form>ФормаРавнаяОснова</Form>",
    "\t\t\t<Form>ФормаРавнаяОснова</Form>\n" +
      "\t\t\t<Form>ФормаИсторическийЭлемент</Form>",
  )
}
```

Получившийся `BaseForm` имеет следующий смысловой состав:

```xml
<BaseForm version="2.20">
  <AutoCommandBar name="ФормаКоманднаяПанель" id="-1"/>
  <ChildItems>
    <InputField name="ИсторическоеПоле" id="30">
      <ContextMenu name="ИсторическоеПолеКонтекстноеМеню" id="31"/>
      <ExtendedTooltip name="ИсторическоеПолеРасширеннаяПодсказка" id="32"/>
    </InputField>
  </ChildItems>
  <Attributes/>
</BaseForm>
```

Внешний `InputField` имеет те же имя, ID и дочерние элементы. Рабочая форма не
получает `Attribute name="БазовыйОбъект"`; корень доступен только из
соответствующей текущей формы `cf`. Минимальная фикстура размещает поле на
верхнем уровне: обычные группы реальной формы не участвуют в вычислении пути,
поэтому дополнительная копия их иерархии не создаёт нового проверяемого
договора.

Вернуть из `importExtension()` текст рабочей и базовой YAML-формы. Добавить проверку:

```ts
it("помечает путь элемента только из исторической основы", () => {
  const { result, historicalFormText, historicalBaseFormText } = importedExtension

  expect(historicalFormText)
    .toContain("ПутьКДанным: !xml/invalid БазовыйОбъект.ИсторическоеПоле")
  expect(historicalFormText).not.toContain("!xml/raw")
  expect(historicalBaseFormText).toContain("ИсторическоеПоле:")
  expect(result.diagnostics).toContainEqual(expect.objectContaining({
    severity: "error",
    message: expect.stringContaining("БазовыйОбъект.ИсторическоеПоле"),
  }))
})
```

Обновить ожидаемое число успешно импортированных назначений с `7` на `8` и
для импорта базовой `cf`, и для импорта расширения. Существующие проверки
отсутствия восстановимой основы для `ФормаРавнаяОснова` и сохранения значимой
основы для `ФормаОтчета` оставить без изменения.

- [ ] **Step 3: Запустить новые проверки и подтвердить дефект**

Run:

```powershell
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project core-metadata metadata/forms/clientApplicationForm/formDataPathContext.test.ts
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project native-lmdb-integration metadata/importFromXml/importConfigurationExtension.integration.test.ts
```

Expected: unit-тест FAIL, потому что `materializeInheritedRootFormDataPaths` пропускает любой `origin: "borrowed"`; интеграционный тест FAIL, потому что YAML содержит диагностическую ошибку, но не содержит материализованного `ПутьКДанным` с `!xml/invalid`.

- [ ] **Step 4: Исправить общую границу материализации**

В `FormElementDataPathState` добавить внутренний необязательный признак:

```ts
readonly presentInCurrentConfiguration?: true
```

При сборке `elementsByName` устанавливать его по фактическому наличию имени в
`params.currentConfigurationForm.elementsByName`, независимо от того, удалось
ли вычислить путь текущего элемента:

```ts
const presentInCurrentConfiguration =
  params.currentConfigurationForm?.elementsByName.has(name) === true
// ...
...(presentInCurrentConfiguration ? { presentInCurrentConfiguration: true as const } : {}),
```

В `materializeInheritedRootFormDataPaths` заменить условие, безусловно
допускающее только `origin === "own"`, на проверку этого признака. Отсутствие
XML `DataPath` в промежуточной YAML-модели разных элементов представлено либо
отсутствующим свойством, либо пустым значением (`undefined`, `null`, `""`),
поэтому все эти варианты являются одной диагностической границей. Непустое
или некорректно типизированное явное значение не перезаписывать:

```ts
for (const element of params.context.elementsByName.values()) {
  const inheritedFromCurrentForm =
    element.origin === "borrowed" && element.presentInCurrentConfiguration === true
  const missingOrEmptyPath =
    !element.present
    || element.value === undefined
    || element.value === null
    || element.value === ""
  if (
    !missingOrEmptyPath
    || element.candidateRootOrigin !== "inherited"
    || element.candidateYaml === undefined
    || inheritedFromCurrentForm
  ) continue
  const parent = recordAtPath(params.yaml, element.yamlPath)
  parent["ПутьКДанным"] = element.candidateYaml
  materialized.push({ parent, key: "ПутьКДанным" })
}
```

Не менять `collectBorrowedFormDataPathChecks`: после материализации существующий structured-document extractor создаст явную проверку по реальному YAML-пути, а общий импортный конвейер сможет применить к ней решение `!xml/invalid`.

- [ ] **Step 5: Запустить целевые проверки**

Run:

```powershell
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project core-metadata metadata/forms/clientApplicationForm/formDataPathContext.test.ts metadata/forms/clientApplicationForm/borrowedFormDataPathPolicy.test.ts metadata/forms/clientApplicationForm/borrowedFormValidation.test.ts
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project native-lmdb-integration metadata/importFromXml/importConfigurationExtension.integration.test.ts
pnpm --filter @nkdk/rules type-check
```

Expected: все проверки PASS; интеграционный результат содержит точечный `!xml/invalid`, сохраняет историческую основу и по-прежнему удаляет восстановимые основы.

- [ ] **Step 6: Проверить новые дубли и закоммитить слой**

Run:

```powershell
pnpm duplicates -- --base a850d8d05
git add packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.ts packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.test.ts packages/rules/metadata/importFromXml/importConfigurationExtension.integration.test.ts
git commit -m "fix: :bug: сохранить ошибочный путь исторической формы"
```

Expected: новые полные дубли отсутствуют; в коммит входят только три перечисленных файла.

---

### Task 2: Реальная приёмка и полная проверка ветки

**Files:**
- No repository files are modified.
- Temporary: `.tmp-borrowed-form-import-acceptance/` inside the worktree; remove after inspection.

**Interfaces:**
- Consumes: свежая сборка `@nkdk/mcp`, `nkdk.import_from_xml`, `nkdk.get_operation`, read-only `C:/git/sed_nkdk/cf`, `C:/git/sed_nkdk/.nkdk/components/cf` and `C:/git/temp`.
- Produces: подтверждение поведения на реальном `ФормаСпискаСПапками/Ext/Form.xml`; repository tree remains unchanged.

- [ ] **Step 1: Собрать актуальный MCP**

Run:

```powershell
pnpm --filter @nkdk/mcp build
```

Expected: exit 0. Перезапустить подключение MCP, если запущенный процесс не использует эту сборку.

- [ ] **Step 2: Подготовить изолированный проект приёмки**

Из корня worktree создать `.tmp-borrowed-form-import-acceptance`, скопировать в него только `C:/git/sed_nkdk/cf` и `C:/git/sed_nkdk/.nkdk/components/cf`. Перед созданием подтвердить, что точный временный путь отсутствует; не удалять и не изменять `C:/git/sed_nkdk`.

- [ ] **Step 3: Импортировать реальную XML-выгрузку**

Вызвать MCP:

```json
{
  "tool": "nkdk.import_from_xml",
  "projectDir": "C:/git/nkdk/.worktrees/form-attribute-borrow-validation/.tmp-borrowed-form-import-acceptance",
  "xmlDir": "C:/git/temp",
  "allowWrite": true,
  "concurrency": 1
}
```

Полученный `operationId` опрашивать через `nkdk.get_operation` до `succeeded` или `failed`. Повторный импорт не запускать.

- [ ] **Step 4: Проверить реальный результат и удалить временный проект**

В
`cfe/дкз/Справочник/ДокументыПредприятия/Формы/ФормаСпискаСПапками/Форма.yaml`
проверить:

```yaml
ПутьКДанным: !xml/invalid Список.ПоказыватьОписаниеИлиЗадачи
```

Проверить, что соседняя `БазоваяФорма.yaml` существует и содержит
`ПоказыватьОписаниеИлиЗадачи`. Затем разрешить абсолютный путь временного
каталога, убедиться, что он находится внутри текущего worktree, и удалить
только `.tmp-borrowed-form-import-acceptance`.

- [ ] **Step 5: Выполнить обязательные проверки репозитория**

Run outside sandbox where required by LMDB:

```powershell
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base a850d8d05
```

Expected: все команды exit 0. `git status --short` показывает только ранее существовавшее пользовательское изменение `packages/mcp/README.md`; временные каталоги и новые незакоммиченные файлы отсутствуют.
