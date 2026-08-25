import { WebProduct } from "./types";
import { enrichProductWithFirecrawl } from "./firecrawlService";

const needsEnrichment = (product: WebProduct): boolean => {
  const missingBasicData =
    product.price == null ||
    !product.image ||
    product.rating == null ||
    product.reviewCount == null;

  const missingSpecifications =
    !product.specifications ||
    Object.keys(product.specifications).length === 0;

  return missingBasicData || missingSpecifications;
};

export const enrichMissingProductData = async (
  products: WebProduct[]
): Promise<WebProduct[]> => {
  const enrichedProducts = await Promise.all(
    products.map(async (product) => {
      if (!needsEnrichment(product)) {
        console.log(
          `Skipping Firecrawl: ${product.name} already has sufficient data`
        );

        return product;
      }

      return enrichProductWithFirecrawl(product);
    })
  );

  return enrichedProducts;
};