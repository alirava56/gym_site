import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";
import { articleMetadata, articleSchema, getPost, posts } from "@/lib/blog";
import { safeArticleHref } from "@/lib/blog-markdown";
import sitemap from "@/app/sitemap";

test("Persian source articles retain the exact bytes supplied in the ZIP", () => {
  const expected = {
    "01-beginner-workout-plan-3-days.md": "f6d9232ed06703248aad77fbbc29a0bf08af1dd0b973228614ae651b39b82da7",
    "02-fat-loss-without-muscle-loss.md": "0e4f735af7a55a04ef8a8d95379c8defe4e7cce77e1aac9c161d912d5611d563",
  };
  for (const [file, hash] of Object.entries(expected)) {
    assert.equal(createHash("sha256").update(readFileSync(`content/blog/source/articles/${file}`)).digest("hex"), hash);
  }
});

test("all article text, table cells, lists, FAQs and sources reach the rendering model", () => {
  assert.equal(posts.length, 2);
  for (const post of posts) {
    const original = post.body.split("\n").filter((line) => !line.startsWith("# ") && !/^\|(?:\s*:?-+:?\s*\|)+\s*$/.test(line) && line !== "---")
      .map((line) => line.replace(/^#{2,4} |^> |^- |^[۰-۹0-9]+\. /g, "").replace(/\|/g, " ")).join(" ").replace(/\s+/g, " ").trim();
    const rendered = post.blocks.flatMap((block) => {
      if (block.type === "divider") return [];
      if (block.type === "table") return [...block.headers, ...block.rows.flat()];
      if (block.type === "list") return block.items;
      return block.text;
    }).join(" ").replace(/\s+/g, " ").trim();
    assert.equal(rendered, original, `Missing or altered content in ${post.slug}`);
    assert.equal(post.blocks.filter((block) => block.type === "table").length, post.slug.startsWith("beginner") ? 4 : 2);
    assert.equal(post.blocks.filter((block) => block.type === "heading" && block.text.endsWith("؟") && block.level === 3).length >= 5, true);
    const ids = post.blocks.filter((block) => block.type === "heading").map((block) => block.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(existsSync(`public${post.image}`));
  }
});

test("metadata, schema, sitemap and cross-links use real public routes without fabricated identities or dates", () => {
  const urls = sitemap().map((item) => item.url);
  for (const post of posts) {
    const meta = articleMetadata(post);
    const schema = articleSchema(post);
    const article = schema["@graph"][0];
    assert.equal(meta.alternates?.canonical, `https://shabeghahremanan.ir${post.href}`);
    assert.equal(meta.title, post.seoTitle);
    assert.equal(meta.description, post.description);
    assert.equal(article["@type"], "BlogPosting");
    assert.equal("author" in article, false);
    assert.equal("datePublished" in article, false);
    assert.equal("dateModified" in article, false);
    assert.ok(urls.includes(`https://shabeghahremanan.ir${post.href}`));
    for (const match of post.body.matchAll(/\]\((\/[^)]+)\)/g)) assert.ok(match[1] === "/" || posts.some((item) => item.href === match[1]));
  }
  assert.ok(urls.includes("https://shabeghahremanan.ir/blog"));
  assert.equal(getPost("../../package.json"), undefined);
  assert.equal(getPost("missing"), undefined);
});

test("Markdown links cannot inject executable or protocol-relative destinations", () => {
  for (const href of ["javascript:alert(1)", "data:text/html,x", "//example.com", "mailto:unknown@example.com"]) assert.equal(safeArticleHref(href), null);
  assert.equal(safeArticleHref("/blog"), "/blog");
  assert.equal(safeArticleHref("https://pubmed.ncbi.nlm.nih.gov/41843416/"), "https://pubmed.ncbi.nlm.nih.gov/41843416/");
});
