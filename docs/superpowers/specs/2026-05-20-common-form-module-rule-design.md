# Common Form Module Rule

## Контекст

`round-trip-yaml --triage --batch-size 5 --start-index 6` показал серию удалений
`CommonForms/<Имя>/Ext/Form/Module.bsl`. Таких удалений в текущем diff `acc` — 431.

Дочерние формы прикладных объектов уже сохраняют модуль формы в YAML как
`Формы/<ИмяФормы>/Модуль.bsl` и восстанавливают его в
`Forms/<ИмяФормы>/Ext/Form/Module.bsl`. Поэтому для путей вида
`<Объект>/Forms/<Форма>/Ext/Form/Module.bsl` текущий diff не показывает удалений.

Отдельно в diff есть 2382 удаления объектных модулей:
`Ext/ManagerModule.bsl`, `Ext/RecordSetModule.bsl` и похожих, в основном у
`InformationRegisters` и `Documents`. Это другая проблема и не входит в этот дизайн.

## Решение

Общие формы должны использовать тот же декларативный механизм внешних модулей, что и
остальные прикладные объекты: правило свойства типа `Module` и существующие
`syncExternalFromXML` / `syncExternalToXML`.

В `MetadataCommonFormRules` добавляем свойство:

```ts
module: {
  type: "Module",
  nkdkPath: "Модуль.bsl",
  xmlPath: "Ext/Form/Module.bsl",
  toXML: false,
  fromXML: false,
}
```

Это свойство не попадает в модель XML/YAML как обычное поле. Оно только сообщает
оркестратору, что у общей формы есть внешний BSL-файл.

## Поток данных

При XML -> YAML:

1. `convertAppliedObjectFromXML` импортирует `CommonForms/<Имя>.xml` и `Ext/Form.xml`.
2. Затем обходит свойства правила и находит тип `Module`.
3. Зарегистрированный обработчик `Module.syncExternalFromXML` копирует
   `CommonForms/<Имя>/Ext/Form/Module.bsl` в
   `ОбщаяФорма/<Имя>/Модуль.bsl`, если файл есть.

При YAML -> XML:

1. `syncAppliedObjectToXML` пишет основной XML общей формы и `Ext/Form.xml`.
2. Затем обходит свойства правила и находит тип `Module`.
3. `Module.syncExternalToXML` копирует `ОбщаяФорма/<Имя>/Модуль.bsl` в
   `CommonForms/<Имя>/Ext/Form/Module.bsl`.
4. Файл добавляется в `xmlManifest`, чтобы финальная очистка `sync` не удаляла его.

## Границы

В рамках этой задачи не меняем:

- существующие XML-фикстуры;
- контракт дочерних форм;
- обработку объектных модулей `Documents`, `InformationRegisters`, `Sequences`;
- общий `ClientApplicationForm` как владелец файлов формы.

Если после исправления первым большим классом diff останутся объектные модули, их нужно
разбирать отдельным дизайном по правилам соответствующих прикладных объектов.

## Проверка

Добавить точечные проверки для `MetadataCommonForm`:

- импорт XML общей формы с `Ext/Form/Module.bsl` создаёт `Модуль.bsl`;
- синхронизация YAML общей формы с `Модуль.bsl` восстанавливает
  `Ext/Form/Module.bsl`;
- `xmlManifest.expectedFiles()` содержит `Ext/Form/Module.bsl`.

После реализации запустить focused-тесты `MetadataCommonForm` и повторить
`round-trip-yaml --triage --batch-size 5 --start-index 6`, чтобы убедиться, что
расхождения по `CommonForms/.../Ext/Form/Module.bsl` ушли из этой пачки.
