"use client";

import React, { useEffect, useState } from "react";

import Image from "next/image";

import Link from "next/link";

import { ArrowLeft, Cross, Trash2, X } from "lucide-react";

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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/comparison/all`,
      );

      const data = await res.json();

      setComparisons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteComparison = async (id: string) => {
    const confirmDelete = confirm("Delete this comparison?");

    if (!confirmDelete) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/comparison/${id}`, {
        method: "DELETE",
      });

      fetchComparisons();
    } catch (err) {
      console.error(err);
    }
  };

  const removeCompetitor = async (comparisonId: string, site: string) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/comparison/${comparisonId}/remove-competitor`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            site,
          }),
        },
      );

      fetchComparisons();
    } catch (err) {
      console.error(err);
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

              const summaryData = [
                {
                  site: "Stonecera",

                  price: myVariation?.pricePerM2 || myVariation?.price,

                  coverage: myVariation?.coverage || 0,

                  pieces: myVariation?.pieces || 0,
                },

                ...item.competitors.map((c) => {
                  const variation = getVariation(
                    c.competitorProduct,
                    c.competitorVariationIndex,
                  );

                  return {
                    site: c.site,

                    price: variation?.pricePerM2 || variation?.price || 0,

                    coverage: variation?.coverage || 0,

                    pieces: variation?.pieces || 0,
                  };
                }),
              ];

              const cheapest = summaryData.reduce((min, item) =>
                item.price < min.price ? item : min,
              );

              const highestCoverage = summaryData.reduce((max, item) =>
                item.coverage > max.coverage ? item : max,
              );

              const mostPieces = summaryData.reduce((max, item) =>
                item.pieces > max.pieces ? item : max,
              );

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
                  label: "£ / m²",
                  my: myVariation?.pricePerM2
                    ? `£${myVariation.pricePerM2}`
                    : "-",
                  key: "pricePerM2",
                },

                {
                  label: "Stock",
                  my: myVariation?.inStock ? "In Stock" : "Out of Stock",
                  key: "stock",
                },
              ];

              return (
                <React.Fragment key={item._id}>
                  {rows.map((row, rowIndex) => (
                    <tr key={`${item._id}-${row.key}`} className="border-b">
                      {/* IMAGE */}
                      {rowIndex === 0 && (
                        <td
                          rowSpan={rows.length}
                          className="p-4 align-top border-r"
                        >
                          {item.myProduct?.image && (
                            <div className="relative w-full h-[180px] rounded-2xl overflow-hidden">
                              <Image
                                src={item.myProduct.image}
                                alt=""
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          )}
                          <div className="flex relative z-10 justify-center mt-3">
                            <button
                              onClick={() => deleteComparison(item._id)}
                              className="bg-red-600 cursor-pointer font-semibold text-white py-1 px-3 rounded-xl flex gap-1 items-center hover:bg-red-700"
                            >
                              <Trash2 size={16} />{" "}
                              <span>Delete Comparison</span>
                            </button>
                          </div>
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
                            <td
                              key={site}
                              className="p-4 border-r text-gray-300"
                            >
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
                            value = variation?.price
                              ? `£${variation.price}`
                              : "-";
                            break;

                          case "pricePerM2":
                            value = variation?.pricePerM2
                              ? `£${variation.pricePerM2}`
                              : "-";
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
                            className={`p-4 border-r transition-all relative ${
                              isLowest ? "bg-green-50 border-green-400" : ""
                            }`}
                          >
                            {row.key === "product" ? (
                              <div className="">
                                <a
                                  href={competitor.competitorProduct?.url}
                                  target="_blank"
                                  className="text-blue-600 hover:underline block"
                                >
                                  {value}
                                </a>

                                <button
                                  onClick={() =>
                                    removeCompetitor(item._id, site)
                                  }
                                  className="text-xs absolute -left-1 -top-3 cursor-pointer flex gap-1 bg-red-50 text-red-600 p-1 rounded-xl hover:bg-red-100"
                                >
                                  <X size={16} /> <span>Remove</span>
                                </button>
                              </div>
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
                  ))}
                  {/* SUMMARY */}
                  <tr className="bg-gray-50 border-b">
                    <td colSpan={3 + allSites.length + 1} className="p-5">
                      <div className="flex flex-wrap gap-3">
                        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-xl text-sm font-medium">
                          🏆 Cheapest → {cheapest.site} (£{cheapest.price})
                        </div>

                        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-xl text-sm font-medium">
                          📦 Highest Coverage → {highestCoverage.site} (
                          {highestCoverage.coverage}
                          m²)
                        </div>

                        <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-xl text-sm font-medium">
                          🧱 Most Pieces → {mostPieces.site} (
                          {mostPieces.pieces})
                        </div>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
