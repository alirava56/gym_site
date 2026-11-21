import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { safeArticleHref, type ArticleBlock } from "@/lib/blog-markdown";

function Inline({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\)|(https:\/\/[^\s<>]+)/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    parts.push(text.slice(last, match.index));
    const key = match.index;
    if (match[1]) parts.push(<strong key={key}><Inline text={match[1]} /></strong>);
    else if (match[2]) parts.push(<em key={key}>{match[2]}</em>);
    else {
      const href = safeArticleHref(match[4] || match[5]);
      const label = match[3] || match[5];
      parts.push(href ? (href.startsWith("/") ? <Link key={key} href={href}>{label}</Link> : <a key={key} href={href} dir={match[5] ? "ltr" : undefined} className={match[5] ? "article-source-url" : undefined}>{label}</a>) : label);
    }
    last = match.index + match[0].length;
  }
  parts.push(text.slice(last));
  return <>{parts}</>;
}

export function ArticleContent({ blocks }: { blocks: ArticleBlock[] }) {
  return <div className="article-prose">{blocks.map((block, index) => {
    switch (block.type) {
      case "heading": {
        const Tag = block.level === 2 ? "h2" : "h3";
        return <Tag key={index} id={block.id}><Inline text={block.text} /></Tag>;
      }
      case "paragraph": return <p key={index}><Inline text={block.text} /></p>;
      case "quote": return <blockquote key={index}><p><Inline text={block.text} /></p></blockquote>;
      case "divider": return <hr key={index} />;
      case "list": {
        const Tag = block.ordered ? "ol" : "ul";
        return <Tag key={index}>{block.items.map((item, i) => <li key={i}><Inline text={item} /></li>)}</Tag>;
      }
      case "table": return <Fragment key={index}>
        <p className="article-table-hint">برای دیدن همه ستون‌ها در موبایل، جدول را به طرفین بکشید.</p>
        <div className="article-table-scroll" role="region" aria-label={block.caption} tabIndex={0}>
          <table><caption className="sr-only">{block.caption}</caption>
            <thead><tr>{block.headers.map((cell, i) => <th key={i} scope="col"><Inline text={cell} /></th>)}</tr></thead>
            <tbody>{block.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => j === 0 ? <th key={j} scope="row"><Inline text={cell} /></th> : <td key={j}><Inline text={cell} /></td>)}</tr>)}</tbody>
          </table>
        </div>
      </Fragment>;
    }
  })}</div>;
}
