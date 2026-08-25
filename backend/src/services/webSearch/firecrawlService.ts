import FirecrawlApp from "@mendable/firecrawl-js";
import { WebProduct } from "./types";

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY,
});

interface FirecrawlProductData {
  name?: string | null;
  price?: number | null;
  currency?: string | null;
  image?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  specifications?: Record<string, string>;
  description?: string | null;
}

const normalizeUrl = (url?: string | null): string => {
  if (!url) return "";

  // [text](https://example.com)
  const markdownMatch = url.match(
    /\[[^\]]*\]\((https?:\/\/[^)]+)\)/
  );

  if (markdownMatch) {
    return markdownMatch[1];
  }

  // (https://example.com)
  const urlMatch = url.match(
    /(https?:\/\/[^\s)]+)/ 
  );

  if (urlMatch) {
    return urlMatch[1];
  }

  return url
    .replace(/[\[\]]/g, "")
    .trim();
};

const hasMissingData = (product: WebProduct): boolean => {
  return (
    product.price == null ||
    !product.image ||
    product.rating == null ||
    product.reviewCount == null ||
    !product.specifications ||
    Object.keys(product.specifications).length === 0
  );
};

export const enrichProductWithFirecrawl = async (
  product: WebProduct
): Promise<WebProduct> => {
  if (!product.sourceUrl) {
    return product;
  }

  if (!hasMissingData(product)) {
    console.log(
      `Skipping Firecrawl: ${product.name}`
    );

    return product;
  }

  try {
    console.log(
      `Firecrawl enrichment: ${product.name}`
    );

    const result = await firecrawl.scrapeUrl(
      product.sourceUrl,
      {
        formats: [
          {
            type: "json",
            schema: {
              type: "object",
              properties: {
                name: {
                  type: ["string", "null"],
                },
                price: {
                  type: ["number", "null"],
                },
                currency: {
                  type: ["string", "null"],
                },
                image: {
                  type: ["string", "null"],
                },
                rating: {
                  type: ["number", "null"],
                },
                reviewCount: {
                  type: ["number", "null"],
                },
                specifications: {
                  type: "object",
                  additionalProperties: {
                    type: "string",
                  },
                },
                description: {
                  type: ["string", "null"],
                },
              },
            },
          },
        ],
      }
    );

    const extracted = (
      result as {
        json?: FirecrawlProductData;
      }
    ).json;

    if (!extracted) {
      console.log(
        `No Firecrawl data: ${product.name}`
      );

      return product;
    }

    return {
      ...product,

      name:
        product.name ||
        extracted.name ||
        "",

      price:
        product.price != null
          ? product.price
          : extracted.price ?? undefined,

      currency:
        product.currency ||
        extracted.currency ||
        undefined,

      image:
        product.image
          ? normalizeUrl(product.image)
          : normalizeUrl(extracted.image),

      rating:
        product.rating != null
          ? product.rating
          : extracted.rating ?? undefined,

      reviewCount:
        product.reviewCount != null
          ? product.reviewCount
          : extracted.reviewCount ?? undefined,

      specifications: {
        ...(extracted.specifications || {}),
        ...(product.specifications || {}),
      },

      description:
        product.description ||
        extracted.description ||
        undefined,

      sourceUrl: normalizeUrl(product.sourceUrl),
    };
  } catch (error) {
    console.error(
      `Firecrawl failed for ${product.name}:`,
      error
    );

    return product;
  }
};