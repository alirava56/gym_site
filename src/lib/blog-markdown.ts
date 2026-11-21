// The supplied articles use this small Markdown subset. Raw HTML is always text.
export type ArticleBlock =
  | { type: "heading"; level: 2 | 3; text: string; id: string }
  | { type: "paragraph" | "quote"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][]; caption: string }
  | { type: "divider" };

const orderedItem = /^[۰-۹0-9]+[.\u06d4] /;
const isList = (line: string) => line.startsWith("- ") || orderedItem.test(line);
const cells = (line: string) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());

export function parseArticle(markdown: string): ArticleBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").trim().split("\n");
  const blocks: ArticleBlock[] = [];
  let headingCount = 0;
  let heading = "جدول مقاله";
  let faq = false;
  for (let i = 0; i < lines.length;) {
    const line = lines[i].trim();
    if (!line || line.startsWith("# ")) { i++; continue; }
    if (/^#{2,4} /.test(line)) {
      const match = /^(#{2,4}) (.+)$/.exec(line)!;
      if (match[2] === "پرسش‌های متداول") faq = true;
      const level = match[1].length === 2 || match[2] === "پرسش‌های متداول" ? 2 : 3;
      heading = match[2];
      blocks.push({ type: "heading", level: faq && match[1].length === 4 ? 3 : level, text: heading, id: `section-${++headingCount}` });
      i++; continue;
    }
    if (line === "---") { blocks.push({ type: "divider" }); i++; continue; }
    if (line.startsWith("|")) {
      const table = { type: "table" as const, headers: cells(line), rows: [] as string[][], caption: heading };
      i += 2; // The second row is the Markdown column separator.
      while (i < lines.length && lines[i].trim().startsWith("|")) table.rows.push(cells(lines[i++]));
      blocks.push(table); continue;
    }
    if (isList(line)) {
      const ordered = orderedItem.test(line);
      const items: string[] = [];
      while (i < lines.length && isList(lines[i].trim()) && orderedItem.test(lines[i].trim()) === ordered) {
        items.push(lines[i++].trim().replace(ordered ? orderedItem : /^- /, ""));
      }
      blocks.push({ type: "list", ordered, items }); continue;
    }
    if (line.startsWith("> ")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) quote.push(lines[i++].slice(2));
      blocks.push({ type: "quote", text: quote.join(" ") }); continue;
    }
    const paragraph = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,4} |---$|\||> )/.test(lines[i]) && !isList(lines[i].trim())) paragraph.push(lines[i++].trim());
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }
  return blocks;
}

export function safeArticleHref(href: string) {
  return /^\/(?!\/)/.test(href) || /^https:\/\//.test(href) ? href : null;
}
