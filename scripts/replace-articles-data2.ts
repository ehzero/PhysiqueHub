import { articlesData2 } from "../src/lib/articles-data2";
import type {
  ArticleData2BodyBlock,
  ArticleData2Draft,
} from "../src/lib/articles-data2";
import { prisma } from "../src/lib/prisma";
import type { ArticleBodyBlock } from "../src/lib/articles-data";

function main() {
  return replaceArticles();
}

async function replaceArticles() {
  const data = articlesData2.map((article, index) => {
    const bodyBlocks = buildBodyBlocks(article);

    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      subtitle: article.metaDescription,
      excerpt: article.excerpt,
      category: article.category,
      categorySlug: article.categorySlug,
      tag: article.tag,
      status: "published",
      language: "ko",
      authorName: article.authorName,
      readMinutes: article.readMinutes,
      posterTheme: article.posterTheme,
      posterFigure: article.posterFigure,
      isFeatured: index === 0,
      sortOrder: index * 10,
      bodyMarkdown: toMarkdown(article, bodyBlocks),
      bodyBlocksJson: JSON.stringify(bodyBlocks),
      sourceUrlsJson: JSON.stringify(article.sources),
      tagsJson: JSON.stringify(
        Array.from(new Set([article.tag, article.mainKeyword, ...article.relatedKeywords])),
      ),
      publishedAt: new Date(`${article.writingStandardDate}T00:00:00+09:00`),
      updatedAt: new Date(),
    };
  });

  const result = await prisma.$transaction(async (tx) => {
    const deleted = await tx.article.deleteMany({});
    const created = await tx.article.createMany({ data });

    return {
      deleted: deleted.count,
      created: created.count,
    };
  });

  console.log(JSON.stringify(result, null, 2));
}

function buildBodyBlocks(article: ArticleData2Draft): ArticleBodyBlock[] {
  const blocks: ArticleBodyBlock[] = article.body.map(toArticleBodyBlock);

  if (article.faq.length > 0) {
    blocks.push({ t: "h", x: "FAQ" });
    blocks.push({ t: "faq", items: article.faq });
  }

  const sourceLinks = article.sources.flatMap((source) => {
    if (!source.url) return [];

    return [{
      label: source.label,
      href: source.url,
      note: `${source.sourceType} · 확인일 ${source.checkedAt}`,
    }];
  });

  if (sourceLinks.length > 0) {
    blocks.push({ t: "h", x: "참고한 주요 출처" });
    blocks.push({ t: "links", items: sourceLinks });
  }

  if (article.internalLinks.length > 0) {
    blocks.push({ t: "h", x: "피지크허브에서 함께 보면 좋은 페이지" });
    blocks.push({
      t: "links",
      items: article.internalLinks.map((link) => ({
        label: link.anchor,
        href: link.href,
        note: link.placement,
      })),
    });
  }

  if (article.additionalChecks.length > 0) {
    blocks.push({ t: "h", x: "작성자가 추가로 확인하면 좋은 사항" });
    blocks.push({ t: "checklist", items: article.additionalChecks });
  }

  return blocks;
}

function toArticleBodyBlock(block: ArticleData2BodyBlock): ArticleBodyBlock {
  if (block.t === "p" || block.t === "h" || block.t === "quote") {
    return { t: block.t, x: block.x };
  }

  if (block.t === "list" || block.t === "summary" || block.t === "checklist") {
    return { t: block.t, items: block.items };
  }

  return {
    t: "table",
    columns: block.columns,
    rows: block.rows,
  };
}

function toMarkdown(article: ArticleData2Draft, blocks: ArticleBodyBlock[]) {
  const lines = [
    `# ${article.title}`,
    "",
    `작성 기준일: ${article.writingStandardDate}`,
    "",
  ];

  for (const block of blocks) {
    if (block.t === "p") {
      lines.push(block.x, "");
      continue;
    }

    if (block.t === "h") {
      lines.push(`## ${block.x}`, "");
      continue;
    }

    if (block.t === "quote") {
      lines.push(`> ${block.x}`, "");
      continue;
    }

    if (block.t === "list" || block.t === "summary" || block.t === "checklist") {
      lines.push(...block.items.map((item) => `- ${item}`), "");
      continue;
    }

    if (block.t === "table") {
      lines.push(`| ${block.columns.join(" | ")} |`);
      lines.push(`| ${block.columns.map(() => "---").join(" | ")} |`);
      lines.push(...block.rows.map((row) => `| ${row.join(" | ")} |`), "");
      continue;
    }

    if (block.t === "faq") {
      for (const item of block.items) {
        lines.push(`### ${item.q}`, "", item.a, "");
      }
      continue;
    }

    if (block.t === "links") {
      lines.push(
        ...block.items.map((item) =>
          item.note
            ? `- [${item.label}](${item.href}) - ${item.note}`
            : `- [${item.label}](${item.href})`
        ),
        "",
      );
    }
  }

  return lines.join("\n").trim();
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
