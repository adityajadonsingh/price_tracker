export interface ProductVariation {
  label?: string;

  size?: string | null;

  thickness?: string | null;

  finish?: string | null;

  material?: string | null;

  pieces?: number | null;

  coverage?: number | null;

  price?: number | null;

  pricePerM2?: number | null;

  inStock?: boolean;

  sku?: string | null;
}

export interface ProductData {
  _id: string;

  site?: string;

  title?: string;

  name?: string;

  image?: string;

  url?: string;

  priceData?: {
    name?: string;

    productType?: string;

    variations?: ProductVariation[];
  };

  variations?: ProductVariation[];
}

export interface ComparisonCompetitor {
  site: string;

  competitorProduct: ProductData;

  competitorVariationIndex: number;
}

export interface ProductComparison {
  _id: string;

  myProduct: ProductData;

  myVariationIndex: number;

  competitors: ComparisonCompetitor[];
}