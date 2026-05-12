"use client";

import { useEffect, useState } from "react";

import Image from "next/image";

import Link from "next/link";

import { ArrowLeft, Trash2 } from "lucide-react";

import {
  ProductComparison,
  ProductData,
  ProductVariation,
} from "@/types/product";

export default function ComparisonListPage() {
  const [comparisons, setComparisons] = useState<ProductComparison[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const filteredComparisons = comparisons.filter((item) =>
    item.myProduct?.name?.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    fetchComparisons();
  }, []);

  const fetchComparisons = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/comparison/all");

      const data = await res.json();

      setComparisons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getVariation = (
    product: ProductData,
    index: number,
  ): ProductVariation | undefined => {
    return (
      product?.priceData?.variations?.[index] || product?.variations?.[index]
    );
  };

  if (loading) {
    return <div className="p-10">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Comparison Dashboard</h1>

          <p className="text-gray-500 mt-2">
            Compare Stonecera products against competitors
          </p>
        </div>

        <Link
          href="/comparison"
          className="bg-black text-white px-5 py-3 rounded-2xl flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back
        </Link>
      </div>

      {/* EMPTY */}
      {comparisons.length === 0 && (
        <div className="bg-white rounded-3xl p-16 text-center shadow-sm">
          <p className="text-gray-500">No comparisons saved yet</p>
        </div>
      )}

      {/* SEARCH */}
      <div className="bg-white rounded-3xl p-5 shadow-sm mb-6">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded-2xl px-4 py-3 outline-none"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-auto bg-white rounded-3xl shadow-sm">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-4 text-left min-w-[220px]">Product</th>

              <th className="p-4 text-left min-w-[180px]">Field</th>

              <th className="p-4 text-left min-w-[260px]">Stonecera</th>

              {Array.from(
                new Set(
                  comparisons.flatMap((c) => c.competitors.map((x) => x.site)),
                ),
              ).map((site) => (
                <th
                  key={site}
                  className="p-4 text-left min-w-[260px] uppercase"
                >
                  {site}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredComparisons.map((item) => {
              const myVariation = getVariation(
                item.myProduct,
                item.myVariationIndex,
              );

              const allSites = Array.from(
                new Set(
                  comparisons.flatMap((c) => c.competitors.map((x) => x.site)),
                ),
              );

              const allPriceValues = [
                myVariation?.pricePerM2 || myVariation?.price,

                ...item.competitors
                  .map((c) => {
                    const variation = getVariation(
                      c.competitorProduct,
                      c.competitorVariationIndex,
                    );

                    return variation?.pricePerM2 || variation?.price || null;
                  })
                  .filter(Boolean),
              ];

              const lowestPrice =
                allPriceValues.length > 0
                  ? Math.min(...(allPriceValues as number[]))
                  : null;

              const rows = [
                {
                  label: "Product",
                  my: item.myProduct?.name,
                  key: "product",
                },

                {
                  label: "Size",
                  my: myVariation?.size,
                  key: "size",
                },

                {
                  label: "Thickness",
                  my: myVariation?.thickness,
                  key: "thickness",
                },

                {
                  label: "Finish",
                  my: myVariation?.finish,
                  key: "finish",
                },

                {
                  label: "Coverage",
                  my: myVariation?.coverage ? `${myVariation.coverage}m²` : "-",
                  key: "coverage",
                },

                {
                  label: "Pieces",
                  my: myVariation?.pieces,
                  key: "pieces",
                },

                {
                  label: "Price",
                  my: myVariation?.price ? `£${myVariation.price}` : "-",
                  key: "price",
                },

                {
                  label: "SKU",
                  my: myVariation?.sku,
                  key: "sku",
                },

                {
                  label: "Stock",
                  my: myVariation?.inStock ? "In Stock" : "Out of Stock",
                  key: "stock",
                },
              ];

              return rows.map((row, rowIndex) => (
                <tr key={`${item._id}-${row.key}`} className="border-b">
                  {/* IMAGE */}
                  {rowIndex === 0 && (
                    <td
                      rowSpan={rows.length}
                      className="p-4 align-top border-r"
                    >
                      {item.myProduct?.image && (
                        <div className="relative w-[180px] h-[180px] rounded-2xl overflow-hidden">
                          <Image
                            src={item.myProduct.image}
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                    </td>
                  )}

                  {/* FIELD */}
                  <td className="p-4 font-medium bg-gray-50 border-r">
                    {row.label}
                  </td>

                  {/* STONECERA */}
                  <td className="p-4 border-r">
                    {row.key === "product" ? (
                      <a
                        href={item.myProduct?.url}
                        target="_blank"
                        className="text-blue-600 hover:underline"
                      >
                        {row.my}
                      </a>
                    ) : (
                      row.my || "-"
                    )}
                  </td>

                  {/* COMPETITORS */}
                  {allSites.map((site) => {
                    const competitor = item.competitors.find(
                      (c) => c.site === site,
                    );

                    if (!competitor) {
                      return (
                        <td key={site} className="p-4 border-r text-gray-300">
                          —
                        </td>
                      );
                    }

                    const variation = getVariation(
                      competitor.competitorProduct,
                      competitor.competitorVariationIndex,
                    );

                    let value = "-";

                    switch (row.key) {
                      case "product":
                        value =
                          competitor.competitorProduct?.title ||
                          competitor.competitorProduct?.name;
                        break;

                      case "size":
                        value = variation?.size;
                        break;

                      case "thickness":
                        value = variation?.thickness;
                        break;
                      case "finish":
                        value = variation?.finish;
                        break;
                      case "coverage":
                        value = variation?.coverage
                          ? `${variation.coverage}m²`
                          : "-";
                        break;

                      case "pieces":
                        value = variation?.pieces;
                        break;

                      case "price":
                        value = variation?.price ? `£${variation.price}` : "-";
                        break;

                      case "sku":
                        value = variation?.sku;
                        break;

                      case "stock":
                        value = variation?.inStock
                          ? "In Stock"
                          : "Out of Stock";
                        break;
                    }

                    const currentPrice =
                      variation?.pricePerM2 || variation?.price;

                    const isLowest =
                      row.key === "price" && currentPrice === lowestPrice;

                    return (
                      <td
                        key={site}
                        className={`p-4 border-r transition-all ${
                          isLowest ? "bg-green-50 border-green-400" : ""
                        }`}
                      >
                        {row.key === "product" ? (
                          <a
                            href={competitor.competitorProduct?.url}
                            target="_blank"
                            className="text-blue-600 hover:underline"
                          >
                            {value}
                          </a>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{value || "-"}</span>

                            {isLowest && (
                              <span className="bg-green-600 text-white text-[10px] px-2 py-1 rounded-full font-bold">
                                LOWEST
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
