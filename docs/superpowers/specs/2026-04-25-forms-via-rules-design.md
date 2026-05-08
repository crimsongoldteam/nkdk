# Экспорт/импорт форм через `rules.ts`

## Цель

Перенести обработку файлов клиентских форм (`Forms/<FormName>.xml`, `Forms/<FormName>/Ext/Form.xml`) с особой ветки в `configuration/{syncToXML,convertFromXML}.ts` на стандартный механизм `syncExternalToXML`/`syncExternalFromXML`, уже используемый для `Module`/`Help`/`Template`. Точка входа — свойство правила с типом `ChildFormNames` в `rules.ts`.

Пример опорного объекта — `packages/core/metadata/appliedObjects/metadataCatalog`.

## Текущее состояние

- В `rules.ts` каталога свойство:
  ```ts
  forms: {
    type: "ChildFormNames",
    xml: "Form",
    folderName: "Формы",
    forReferenceOnly: true,
    toYAML: false,
    fromYAML: false,
    xmlParents: ["ChildObjects"],
  }
  ```
  Используется только как маркер для генерации `<ChildObjects><Form>…</Form></ChildObjects>` в основном XML объекта.
- Сами файлы форм обрабатываются отдельной веткой в `configuration/syncToXML.ts` и `configuration/convertFromXML.ts`:
  - проверка `hasForms = ...some(p => p.type === "ChildFormNames")`;
  - сканирование `Формы/` (или `Forms/`) с дисковой структурой;
  - постановка отдельных `BatchTask` `kind: "form"` с `parent`-ссылкой на объект;
  - прямые вызовы `syncFormToXML` / `convertFormFromXML`.
- Параллелизм форм — через общий батч (`IO_CONCURRENCY = 64`).

## Целевое состояние

`configuration/{syncToXML,convertFromXML}.ts` ничего не знает о формах. Обработчик форм зарегистрирован на типе `ChildFormNames` через `registerTypeRule(...)` и подхватывается общим циклом по `rule.properties` в `appliedObject/{syncToXML,convertFromXML}.ts`.

### Архитектурный инвариант

Свойство правила с типом `ChildFormNames` совмещает две роли:
1. **Сериализация в основной XML** — даёт `<ChildObjects><Form>…</Form></ChildObjects>`. Сохраняется без изменений.
2. **Синхронизация внешних файлов форм** — новый хук `syncExternalToXML`/`syncExternalFromXML`. Папка определяется полем `folderName` правила.

## Изменения по компонентам

### `orchestration/property/fn.ts`

Расширить сигнатуру обоих типов хуков:

```ts
export type SyncExternalToXMLFunction = (params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  nkdkDir: string
  xmlDir: string
  name: string                  // НОВОЕ: имя объекта
  referenceDir?: string         // НОВОЕ: эталонная директория для round-trip
  itemName?: string
}) => Promise<void>

export type SyncExternalFromXMLFunction = (params: {
  context: ConfigurationContextFromXML
  rule: PropertyRule
  xmlDir: string
  nkdkDir: string
  name: string                  // НОВОЕ
  itemName?: string
}) => Promise<void>
```

`name` — обязательное поле. Существующие реализации (`syncModuleToXML`, `syncHelp*ToXML`/`FromXML`) его просто игнорируют. `referenceDir` — опциональное.

### `orchestration/appliedObject/syncToXML.ts` и `convertFromXML.ts`

В местах вызова `syncFn({...})` добавить новые поля:

```ts
await syncFn({
  context: contextWithForms,
  rule: propRule,
  nkdkDir,
  xmlDir: outputDir,
  name,
  referenceDir,                 // для syncToXML
})
```

Никакой логики «знать про формы» в оркестраторе не появляется. Существующий блок `collectFolderNames(rule, "ChildFormNames", ...)` для `context.exportToXML.context.forms` остаётся как есть.

### Новые файлы

**`packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts`**

```ts
import fs from "fs"
import { join } from "path"
import { syncFormToXML } from "~/metadata/forms/clientApplicationForm/syncToXML"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import type { SyncExternalToXMLFunction } from "~/metadata/orchestration/property/fn"
import type { ChildFormNamesPropertyRule } from "./types"

export const syncChildFormNamesToXML: SyncExternalToXMLFunction = async (params) => {
  const { context, rule: rawRule, nkdkDir, xmlDir, name, referenceDir } = params
  const rule = rawRule as ChildFormNamesPropertyRule

  const formsDir = join(nkdkDir, rule.folderName)
  if (!fs.existsSync(formsDir)) return

  const formEntries = await fs.promises.readdir(formsDir, { withFileTypes: true })
  const formNames = formEntries
    .filter((e) => e.isDirectory())
    .filter((e) => {
      const yamlPath = join(formsDir, e.name, "Форма.yaml")
      const nkdkPath = join(formsDir, e.name, "Форма.nkdk")
      return fs.existsSync(yamlPath) && fs.existsSync(nkdkPath)
    })
    .map((e) => e.name)

  const formOutputDir = join(xmlDir, name)
  const formReferenceDir = referenceDir ? join(referenceDir, name, "Forms") : undefined

  for (const formName of formNames) {
    await syncFormToXML({
      context,
      inputDir: nkdkDir,
      formName,
      outputDir: formOutputDir,
      referenceDir: formReferenceDir,
    })
  }
}

registerTypeRule("ChildFormNames", "syncExternalToXML", syncChildFormNamesToXML)
```

**`packages/core/metadata/commonObjects/childFormNames/syncExternalFromXML.ts`**

Симметрично: сканирует `xmlDir/<name>/Forms/*.xml`, для каждого вызывает `convertFormFromXML({ context, inputDir: join(xmlDir, name, "Forms"), formName, outputDir: nkdkDir })`.

### Изменения в `configuration/syncToXML.ts`

Удалить:
- импорт `syncFormToXML`;
- проверку `hasForms`;
- ветку с `discoveries`/`formNames`/`formOutputDir`/`formReferenceDir`;
- постановку `BatchTask` `kind: "form"`.

Остаётся единый цикл, ставящий по одной задаче на объект.

### Изменения в `configuration/convertFromXML.ts`

Аналогично: удаляются импорт `convertFormFromXML`, ветка `formDiscoveries`, постановка `kind: "form"` задач.

### Точка регистрации

Импорт новых модулей добавляется туда же, где сейчас импортируются `commonObjects/module/{toXML,fromXML}.ts` и пр. (фактическое место — ближайший index, выполняющий побочные регистрации). Уточняется при реализации; на дизайн не влияет.

## Поток данных (после рефакторинга)

**Экспорт (`syncConfigurationToXML`):**

1. Цикл по `TopLevelMetadataItemRules` → одна `BatchTask` на объект.
2. `syncAppliedObjectToXML(rule, ..., name, outputDir, referenceDir)` для каждого объекта.
3. Внутри — общий цикл по `rule.properties` вызывает `syncExternalToXML` для свойств с зарегистрированным хуком.
4. Хук `syncChildFormNamesToXML` сканирует `<inputDir>/<name>/Формы/` и последовательно вызывает `syncFormToXML` для каждой.

**Импорт (`syncConfigurationFromXML`):** симметрично.

## Обработка ошибок

`BatchTask` существует только на уровне объектов. Любая ошибка обработки формы пробрасывается из `syncFormToXML`/`convertFormFromXML` через хук в `syncAppliedObjectToXML` → `BatchTask.run` и попадает в `ConfigurationSyncResult.failed` записью:

- `kind = rule.itemType` (например, `"MetadataCatalog"`),
- `name = <имя_объекта>`,
- `parent` отсутствует.

**Принимаемая регрессия:**
- Формы одного объекта обрабатываются последовательно (раньше — параллельно через общий батч).
- Первая ошибка формы прерывает обработку остальных форм этого же объекта.
- Гранулярность `kind: "form"` в результате теряется — все ошибки форм объединяются под объектом.

Параллелизм между разными объектами сохраняется (`IO_CONCURRENCY = 64`).

## Тестирование

**Новые тесты:**
- `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.test.ts` — минимальный каталог с одной формой → проверка наличия `Catalogs/<name>.xml`, `Catalogs/<name>/Forms/<form>.xml`, `Catalogs/<name>/Forms/<form>/Ext/Form.xml`.
- `packages/core/metadata/commonObjects/childFormNames/syncExternalFromXML.test.ts` — симметрично.

**Обновляемые тесты:**
- `packages/core/metadata/orchestration/appliedObject/syncToXML.test.ts` / `convertFromXML.test.ts` — убедиться, что round-trip с формами работает через общий путь.
- `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts` / `convertFromXML.test.ts` — пересмотреть ассерты по `ConfigurationSyncResult` (нет `kind: "form"`; ошибки форм — под `kind` объекта).

**Перед закрытием задачи:** обязательный прогон `pnpm test` из корня.

## Документация

Обновить `.agents/architecture-orchestration.md`: добавить раздел «Свойства с типом `ChildFormNames`» по образцу раздела «Свойства с `filePath`». Описать:
- двойную роль свойства (тег `<ChildObjects><Form>…</Form></ChildObjects>` + синхронизация файлов форм);
- расширенную сигнатуру `SyncExternalToXMLFunction`/`SyncExternalFromXMLFunction` с полями `name` и `referenceDir`;
- последовательную обработку форм внутри одного объекта.

## Границы

Из задачи **исключены**:
- любые изменения в `syncFormToXML` / `convertFormFromXML` (их API уже подходит);
- любые изменения в `Module`/`Help`/`Template`-обработчиках (их новые поля `name`/`referenceDir` просто игнорируют);
- унификация семантики `xmlDir` между `Module`/`Help` и формами;
- обобщение хука `ChildFormNames` на другие типы дочерних коллекций с файлами.
