pub struct JournalColumn {
    pub name: String,
    pub uuid: String,
    pub xml: String,
}

pub fn extract(source: &str) -> Vec<JournalColumn> {
    let mut columns = Vec::new();
    let mut rest = source;
    while let Some((_, suffix)) = rest.split_once("<Column uuid=\"") {
        let (body, tail) = suffix
            .split_once("</Column>")
            .expect("complete journal column");
        let uuid = body.split_once('"').expect("column UUID").0;
        let name = body
            .split_once("<Name>")
            .expect("column name")
            .1
            .split_once("</Name>")
            .expect("complete column name")
            .0;
        columns.push(JournalColumn {
            name: name.to_owned(),
            uuid: uuid.to_owned(),
            xml: format!("<Column uuid=\"{body}</Column>"),
        });
        rest = tail;
    }
    columns
}
