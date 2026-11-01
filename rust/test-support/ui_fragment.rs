//! QName bindings lost when a UI element is extracted from its document.
pub fn document(xml: &str) -> String {
    xml.replace("<Root>", "<Root xmlns:style=\"http://v8.1c.ru/8.1/data/ui/style\" xmlns:sys=\"http://v8.1c.ru/8.1/data/ui/fonts/system\" xmlns:win=\"http://v8.1c.ru/8.1/data/ui/colors/windows\" xmlns:web=\"http://v8.1c.ru/8.1/data/ui/colors/web\">")
}
