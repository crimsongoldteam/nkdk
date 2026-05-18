# Raw Picture LoadTransparent round-trip

## Контекст

Расхождения #3-#5 из `acc` находятся в формах документов:

- `Documents/ПлатежноеПоручение/Forms/ФормаДокумента/Ext/Form.xml`
- `Documents/ПлатежноеПоручение/Forms/ФормаДокументаНалоговая/Ext/Form.xml`
- `Documents/ПлатежноеТребование/Forms/ФормаДокумента/Ext/Form.xml`

Во всех случаях исходный XML содержит raw-ссылку на картинку:

```xml
<Picture>
  <xr:Ref>0:05f4dd91-2d70-4f80-accc-4f1980cba51a</xr:Ref>
  <xr:LoadTransparent>false</xr:LoadTransparent>
</Picture>
```

или:

```xml
<Picture>
  <xr:Ref>0:05f4dd91-2d70-4f80-accc-4f1980cba51a</xr:Ref>
  <xr:LoadTransparent>true</xr:LoadTransparent>
</Picture>
```

После short round-trip `xr:LoadTransparent` пропадает.

## Наблюдения

Для обычных картинок текущая YAML-логика использует дефолты:

- `StandardPicture` -> `loadTransparent=true`;
- `CommonPicture` и `AbsolutePicture` -> `loadTransparent=false`.

Для XML это значение задано явно. Для raw-ссылок вычислять его из `rawRef` нельзя:

- один и тот же raw ref `0:05f4dd91-2d70-4f80-accc-4f1980cba51a` встречается и с `false`, и с `true`;
- raw ref `0` встречается с `true` и `xr:TransparentPixel`;
- raw ref с другим UUID встречается с `false`.

Значит `LoadTransparent` для raw-ссылок является частью XML-состояния, а не выводимым дефолтом.

## Цель

Сохранять `xr:LoadTransparent` и `xr:TransparentPixel` у raw `Picture` при XML round-trip.

Границы задачи:

- меняется только `packages/core/metadata/commonObjects/picture`;
- обычные `StandardPicture`, `CommonPicture` и `AbsolutePicture` сохраняют текущую модель;
- raw-ссылка без `LoadTransparent` продолжает round-trip без добавления нового узла;
- YAML-форма raw-ссылки строкой остается прежней, чтобы не менять существующий YAML без необходимости.

## Дизайн

Расширить `RawPictureRef`:

```ts
type RawPictureRef = {
  rawRef: string
  loadTransparent?: boolean
  transparentPixel?: {
    x: number
    y: number
  }
}
```

`fromXML` для raw-ссылки должен:

1. сохранить `rawRef`;
2. если `xr:LoadTransparent` задан, сохранить `loadTransparent`;
3. если `xr:TransparentPixel` задан, сохранить `transparentPixel`.

`toXML` для raw-ссылки должен:

1. всегда писать `xr:Ref`;
2. писать `xr:LoadTransparent`, только если `loadTransparent` задан;
3. писать `xr:TransparentPixel`, только если `transparentPixel` задан.

Порядок XML-узлов: `xr:Ref`, затем `xr:LoadTransparent`, затем `xr:TransparentPixel`.

## Данные и поток

1. XML `Picture` с raw `xr:Ref` импортируется в `RawPictureRef`.
2. Явные настройки прозрачности остаются в модели.
3. Экспорт raw `Picture` восстанавливает исходные XML-узлы.
4. Расхождения #3-#5 исчезают одним исправлением.

## Тестирование

Добавить тесты в `picture`:

- импорт raw ref с `xr:LoadTransparent=false`;
- импорт raw ref с `xr:LoadTransparent=true`;
- импорт raw ref `0` с `xr:TransparentPixel`;
- экспорт raw ref с `loadTransparent=false`;
- экспорт raw ref с `loadTransparent=true`;
- экспорт raw ref с `transparentPixel`.

Существующие тесты для raw ref без прозрачности должны остаться зелеными.

После реализации запустить узкие тесты `picture`, а перед закрытием всей серии задач - полный
`pnpm test` из корня.

## Не входит

- Не менять XML-фикстуры внешнего XML-репозитория.
- Не менять правила или модель обычных linked pictures.
- Не выводить `LoadTransparent` для raw ref эвристически из значения ссылки.
