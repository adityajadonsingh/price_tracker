"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowRightLeft, Check, ChevronDown, Search } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ComparisonModal({
  open,
  onClose,
  preselectedCompetitor,
}: any) {

  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [competitorProducts, setCompetitorProducts] = useState<any[]>([]);

  const [competitorSite, setCompetitorSite] = useState("universal");

  const [selectedMyProduct, setSelectedMyProduct] = useState<any>(null);

  const [selectedCompetitorProduct, setSelectedCompetitorProduct] =
    useState<any>(null);

  useEffect(() => {
    if (preselectedCompetitor) {
      setSelectedCompetitorProduct(preselectedCompetitor);

      setCompetitorSite(preselectedCompetitor.site);

      const competitorName =
        preselectedCompetitor?.priceData?.name ||
        preselectedCompetitor?.title ||
        preselectedCompetitor?.name ||
        "";

      const firstWord = competitorName.split(" ")[0];

      setMySearch(firstWord);
    }
  }, [preselectedCompetitor]);

  const [selectedMyVariation, setSelectedMyVariation] = useState<number | null>(
    null,
  );

  const [selectedCompetitorVariation, setSelectedCompetitorVariation] =
    useState<number | null>(null);

  const [mySearch, setMySearch] = useState("");
  const [competitorSearch, setCompetitorSearch] = useState("");

  const [saving, setSaving] = useState(false);

  const [selectedCompetitors, setSelectedCompetitors] = useState<any[]>([]);
  
  // =========================
  // HELPERS
  // =========================

  const getVariations = (item: any) => {
    return item?.priceData?.variations || item?.variations || [];
  };

  const loadExistingComparison = async (
      productId: string,
      variationIndex: number,
    ) => {
      try {
        const res = await fetch(
          `${API_URL}/comparison/find?myProductId=${productId}&myVariationIndex=${variationIndex}`,
        );
  
        const data = await res.json();
  
        if (data?.competitors) {
          setSelectedCompetitors(data.competitors);
        } else {
          setSelectedCompetitors([]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    useEffect(() => {
      if (selectedMyProduct && selectedMyVariation !== null) {
        loadExistingComparison(selectedMyProduct._id, selectedMyVariation);
      }
    }, [selectedMyProduct, selectedMyVariation]);

  const addCompetitor = () => {
    if (!selectedCompetitorProduct || selectedCompetitorVariation === null) {
      alert("Select competitor product + variation");

      return;
    }

    const newCompetitor = {
      site: competitorSite,

      competitorProductId: selectedCompetitorProduct._id,

      competitorVariationIndex: selectedCompetitorVariation,

      competitorProduct: selectedCompetitorProduct,
    };

    setSelectedCompetitors((prev) => {
      const existingSiteIndex = prev.findIndex(
        (c) => c.site === competitorSite,
      );

      // 🔥 REPLACE SAME SITE
      if (existingSiteIndex !== -1) {
        const updated = [...prev];

        updated[existingSiteIndex] = newCompetitor;

        return updated;
      }

      // 🔥 ADD NEW SITE
      return [...prev, newCompetitor];
    });

    setSelectedCompetitorProduct(null);

    setSelectedCompetitorVariation(null);
  };

  const getProductName = (item: any) => {
    return (
      item?.priceData?.name || item?.name || item?.title || "Unnamed Product"
    );
  };

  // =========================
  // FETCH
  // =========================

  const fetchMyProducts = async () => {
    const res = await fetch(`${API_URL}/urls/stonecera`);

    const data = await res.json();

    setMyProducts(data || []);
  };

  const fetchCompetitorProducts = async () => {
    const res = await fetch(`${API_URL}/urls/${competitorSite}`);

    const data = await res.json();

    setCompetitorProducts(data || []);
  };

  useEffect(() => {
    fetchMyProducts();
  }, []);

  useEffect(() => {
    fetchCompetitorProducts();

    setSelectedCompetitorProduct(null);
    setSelectedCompetitorVariation(null);
  }, [competitorSite]);

  // =========================
  // FILTERS
  // =========================

  const filteredMyProducts = useMemo(() => {
    return myProducts.filter((item) =>
      getProductName(item).toLowerCase().includes(mySearch.toLowerCase()),
    );
  }, [myProducts, mySearch]);

  const filteredCompetitorProducts = useMemo(() => {
    return competitorProducts.filter((item) =>
      getProductName(item)
        .toLowerCase()
        .includes(competitorSearch.toLowerCase()),
    );
  }, [competitorProducts, competitorSearch]);

  // =========================
  // SAVE
  // =========================

  const saveComparison = async () => {
    if (
      !selectedMyProduct ||
      selectedMyVariation === null ||
      selectedCompetitors.length === 0
    ) {
      alert("Please select products + variations");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`${API_URL}/comparison/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          myProductId: selectedMyProduct._id,

          myVariationIndex: selectedMyVariation,

          competitors: selectedCompetitors.map((c) => ({
            site: c.site,

            competitorProductId: c.competitorProductId,

            competitorVariationIndex: c.competitorVariationIndex,
          })),
        }),
      });

      const data = await res.json();

      console.log(data);

      alert("Comparison saved successfully");

      setSelectedCompetitors([]);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save comparison");
    } finally {
      setSaving(false);
    }
  };
if (!open) return null;
  // =========================
  // UI
  // =========================

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 overflow-y-auto p-6"
      onClick={onClose}
    >
      <div className="max-w-7xl mx-auto">
        <div
          className="max-w-7xl mx-auto space-y-3 relative z-60"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="bg-white rounded-3xl shadow-sm px-4 py-2 flex items-center gap-3">
            <div className="flex gap-3 items-center">
              <ArrowRightLeft size={26} className="text-blue-600" />
              <div>
                <span className="text-xl font-bold">Product Comparison</span>

                <p className="text-gray-500">
                  Match Stonecera products against competitors
                </p>
              </div>
            </div>
            <div className="ml-auto">
              <button
                onClick={onClose}
                className="bg-gray-100 cursor-pointer hover:bg-gray-200 rounded-xl px-4 py-2"
              >
                Close
              </button>
            </div>
          </div>

          {/* GRID */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* LEFT */}
            <div className="bg-white rounded-3xl shadow-sm p-5 space-y-5">
              <div>
                <h2 className="text-xl font-bold">Stonecera Products</h2>
              </div>

              {/* SEARCH */}
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  placeholder="Search Stonecera products..."
                  value={mySearch}
                  onChange={(e) => setMySearch(e.target.value)}
                  className="w-full border rounded-2xl pl-11 pr-4 py-3 outline-none"
                />
              </div>

              {/* PRODUCTS */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {filteredMyProducts.map((item) => {
                  const variations = getVariations(item);

                  return (
                    <div
                      key={item._id}
                      onClick={() => {
                        setSelectedMyProduct(item);
                        setSelectedMyVariation(null);
                      }}
                      className={`border rounded-2xl p-4 cursor-pointer transition ${
                        selectedMyProduct?._id === item._id
                          ? "border-blue-600 bg-blue-50"
                          : "hover:border-gray-400"
                      }`}
                    >
                      <div className="flex gap-4">
                        {item.image && (
                          <div className="relative h-20 w-20 rounded-xl overflow-hidden shrink-0">
                            <Image
                              src={item.image}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}

                        <div className="flex-1">
                          <p className="font-semibold line-clamp-2">
                            {getProductName(item)}
                          </p>

                          <p className="text-sm text-gray-500 mt-2">
                            {variations.length} variations
                          </p>
                        </div>
                      </div>

                      {/* VARIATIONS */}
                      {selectedMyProduct?._id === item._id && (
                        <div className="mt-5 space-y-2">
                          {variations.map((variation: any, idx: number) => (
                            <button
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMyVariation(idx);
                              }}
                              className={`w-full border rounded-xl p-3 text-left transition ${
                                selectedMyVariation === idx
                                  ? "border-green-600 bg-green-50"
                                  : "hover:border-gray-400"
                              }`}
                            >
                              <div className="flex justify-between gap-4">
                                <div>
                                  <p className="font-medium">
                                    {variation.label}
                                  </p>

                                  <p className="text-xs text-gray-500 mt-1">
                                    {[
                                      variation.size,
                                      variation.thickness,
                                      variation.finish,
                                      variation.coverage
                                        ? `${variation.coverage}m²`
                                        : null,
                                      variation.pieces
                                        ? `${variation.pieces} pcs`
                                        : null,
                                    ]
                                      .filter(Boolean)
                                      .join(" | ")}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <p className="font-bold text-green-600">
                                    £{variation.price}
                                  </p>

                                  <p className="text-xs text-gray-500">
                                    £{variation.pricePerM2}
                                    /m²
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT */}
            <div className="bg-white rounded-3xl shadow-sm p-5 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold">Competitor Products</h2>

                <div className="relative">
                  <select
                    value={competitorSite}
                    onChange={(e) => setCompetitorSite(e.target.value)}
                    className="appearance-none border rounded-2xl px-4 py-3 pr-10 outline-none"
                  >
                    <option value="universal">Universal Paving</option>

                    <option value="nustone">NuStone</option>
                  </select>

                  <ChevronDown
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                </div>
              </div>

              {/* SEARCH */}
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  placeholder="Search competitor products..."
                  value={competitorSearch}
                  onChange={(e) => setCompetitorSearch(e.target.value)}
                  className="w-full border rounded-2xl pl-11 pr-4 py-3 outline-none"
                />
              </div>

              {/* PRODUCTS */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {filteredCompetitorProducts.map((item) => {
                  const variations = getVariations(item);

                  return (
                    <div
                      key={item._id}
                      onClick={() => {
                        setSelectedCompetitorProduct(item);

                        setSelectedCompetitorVariation(null);
                      }}
                      className={`border rounded-2xl p-4 cursor-pointer transition ${
                        selectedCompetitorProduct?._id === item._id
                          ? "border-blue-600 bg-blue-50"
                          : "hover:border-gray-400"
                      }`}
                    >
                      <div className="flex gap-4">
                        {item.image && (
                          <div className="relative h-20 w-20 rounded-xl overflow-hidden shrink-0">
                            <Image
                              src={item.image}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}

                        <div className="flex-1">
                          <p className="font-semibold line-clamp-2">
                            {getProductName(item)}
                          </p>

                          <p className="text-sm text-gray-500 mt-2">
                            {variations.length} variations
                          </p>
                        </div>
                      </div>

                      {/* VARIATIONS */}
                      {selectedCompetitorProduct?._id === item._id && (
                        <div className="mt-5 space-y-2">
                          {variations.map((variation: any, idx: number) => (
                            <button
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();

                                setSelectedCompetitorVariation(idx);
                              }}
                              className={`w-full border rounded-xl p-3 text-left transition ${
                                selectedCompetitorVariation === idx
                                  ? "border-green-600 bg-green-50"
                                  : "hover:border-gray-400"
                              }`}
                            >
                              <div className="flex justify-between gap-4">
                                <div>
                                  <p className="font-medium">
                                    {variation.label}
                                  </p>

                                  <p className="text-xs text-gray-500 mt-1">
                                    {[
                                      variation.size,
                                      variation.thickness,
                                      variation.finish,
                                      variation.coverage
                                        ? `${variation.coverage}m²`
                                        : null,
                                      variation.pieces
                                        ? `${variation.pieces} pcs`
                                        : null,
                                    ]
                                      .filter(Boolean)
                                      .join(" | ")}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <p className="font-bold text-green-600">
                                    £{variation.price}
                                  </p>

                                  <p className="text-xs text-gray-500">
                                    £{variation.pricePerM2}
                                    /m²
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SAVE */}
          {/* ADDED COMPETITORS */}
          <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Added Competitors</h2>

                <p className="text-sm text-gray-500 mt-1">
                  Add multiple competitor products before saving
                </p>
              </div>

              <button
                onClick={addCompetitor}
                className="bg-green-600 hover:bg-green-700 text-white rounded-2xl px-5 py-3 font-medium"
              >
                Add Competitor
              </button>
            </div>

            {selectedCompetitors.length === 0 ? (
              <div className="border border-dashed rounded-2xl p-8 text-center text-gray-400">
                No competitors added yet
              </div>
            ) : (
              <div className="space-y-3">
                {selectedCompetitors.map((c, idx) => {
                  const variation =
                    c.competitorProduct?.priceData?.variations?.[
                      c.competitorVariationIndex
                    ] ||
                    c.competitorProduct?.variations?.[
                      c.competitorVariationIndex
                    ];

                  return (
                    <div
                      key={idx}
                      className="border rounded-2xl p-4 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="font-semibold">{c.site.toUpperCase()}</p>

                        <p className="text-sm text-gray-600 mt-1">
                          {c.competitorProduct?.priceData?.name ||
                            c.competitorProduct?.title ||
                            c.competitorProduct?.name}
                        </p>

                        {variation && (
                          <p className="text-xs text-gray-500 mt-1">
                            {variation.label}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedCompetitors((prev) =>
                            prev.filter((_, i) => i !== idx),
                          );
                        }}
                        className="text-red-600 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="bg-white rounded-3xl shadow-sm p-6 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-lg">Ready to save comparison?</p>

              <p className="text-sm text-gray-500 mt-1">
                Match Stonecera variation against competitor variation
              </p>
            </div>

            <button
              onClick={saveComparison}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 py-3 font-medium flex items-center gap-2"
            >
              <Check size={18} />

              {saving ? "Saving..." : "Save Comparison"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
