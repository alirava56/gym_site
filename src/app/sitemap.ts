import type { MetadataRoute } from "next";
import { posts } from "@/lib/blog";
import { absoluteUrl } from "@/shared/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/blog", ...posts.map((post) => post.href)].map((path) => ({ url: absoluteUrl(path) }));
}
