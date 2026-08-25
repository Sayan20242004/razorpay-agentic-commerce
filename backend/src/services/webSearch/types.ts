export interface WebProduct {
  name: string;
  price?: number | null;
  currency?: string | null;
  image?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  specifications: Record<string, string>;
  description?: string | null;
  sourceName?: string | null;
  sourceUrl: string;
}