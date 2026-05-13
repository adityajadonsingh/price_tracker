"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ComparisonModal from "@/components/ComparisonModal";
import {
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Plus,
  Trash2,
  Save,
  PackageSearch,
  X,
  Boxes,
} from "lucide-react";

function collectAllUrls(node: any): string[] {
  let urls = [...(node.__urls || [])];

  Object.values(node.__children || {}).forEach((child: any) => {
    urls = [...urls, ...collectAllUrls(child)];
  });

  return urls;
}

/* TREE NODE */
function TreeNode({
  nodeKey,
  node,
  onSelect,
}: {
  nodeKey: string;
  node: any;
  onSelect: (urls: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="ml-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen(!open)}
          className="text-gray-500 hover:text-black"
        >
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        <span
          className="cursor-pointer text-sm hover:text-blue-600"
          onClick={() => onSelect(collectAllUrls(node))}
        >
          {nodeKey}
        </span>
      </div>

      {open && (
        <div className="ml-2 border-l pl-2 mt-1">
          {Object.entries(node.__children || {}).map(([key, child]) => (
            <TreeNode
              key={key}
              nodeKey={key}
              node={child}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SitePage() {
  const params = useParams();
  const site = params.site as string;

  const [filteredUrls, setFilteredUrls] = useState<string[]>([]);
  const [filteredSearch, setFilteredSearch] = useState("");
  const [urls, setUrls] = useState<any[]>([]);
  const [tree, setTree] = useState<any>({});
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [fetchedUrls, setFetchedUrls] = useState<string[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"sitemap" | "product">("sitemap");
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const [singleUrl, setSingleUrl] = useState("");
  const [singleLoading, setSingleLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<any>(null);
  const [comparisonMap, setComparisonMap] = useState<any>({});
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [refreshingAll, setRefreshingAll] = useState(false);

  const searchedFilteredUrls = filteredUrls.filter((url) =>
    url.toLowerCase().includes(filteredSearch.toLowerCase()),
  );

  const fetchComparisonMap = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/comparison/status-map/${site}`,
      );

      const data = await res.json();

      setComparisonMap(data);
    } catch (err) {
      console.error(err);
    }
  };

  /* FETCH PRODUCTS */
  const fetchSavedUrls = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/urls/${site}`);

    const data = await res.json();

    setUrls(data);
  };

  useEffect(() => {
    const interval = setInterval(fetchSavedUrls, 5000);

    return () => clearInterval(interval);
  }, []);

  /* LOAD SITEMAP */
  const loadSitemap = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/sitemap/${site}`,
    );

    const data = await res.json();

    setFetchedUrls(data.urls || []);
    setTree(data.tree || {});
  };
  useEffect(() => {
    fetchSavedUrls();
    fetchComparisonMap();
    loadSitemap();
  }, []);

  /* FETCH SITEMAP */
  const fetchSitemap = async () => {
    if (!sitemapUrl) return;

    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sitemap/fetch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sitemapUrl,
            site,
          }),
        },
      );

      const data = await res.json();

      setFetchedUrls(data.urls || []);
      setSelectedUrls(data.urls || []);
      setTree(data.tree || {});
    } finally {
      setLoading(false);
    }
  };

  /* FETCH SINGLE PRODUCT */
  const fetchSingleProduct = async () => {
    if (!singleUrl) return;

    setSingleLoading(true);

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/urls/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          site,
          urls: [singleUrl],
        }),
      });

      setSingleUrl("");

      fetchSavedUrls();
    } catch (err) {
      console.error(err);
    } finally {
      setSingleLoading(false);
    }
  };

  /* REFRESH SINGLE PRODUCT */
  const refreshProduct = async (id: string) => {
    try {
      setRefreshingId(id);

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/urls/refresh/${id}`, {
        method: "POST",
      });

      await fetchSavedUrls();
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshingId(null);
    }
  };

  /* REFRESH ALL */
  const refreshAllProducts = async () => {
    try {
      setRefreshingAll(true);

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/urls/refresh-all/${site}`,
        {
          method: "POST",
        },
      );

      await fetchSavedUrls();
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshingAll(false);
    }
  };

  /* DELETE PRODUCT */
  const deleteProduct = async (id: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/urls/${id}`, {
        method: "DELETE",
      });

      setUrls((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error("Delete failed");
    }
  };

  /* TOGGLE URL */
  const toggleUrl = (url: string) => {
    setSelectedUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url],
    );
  };

  /* SAVE */
  const saveSelected = async () => {
    if (!selectedUrls.length) return;

    setSaving(true);

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/urls/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          site,
          urls: selectedUrls,
        }),
      });

      fetchSavedUrls();

      setSelectedUrls([]);
    } finally {
      setSaving(false);
    }
  };

  const getVariations = (item: any) => {
    return item.priceData?.variations || item.variations || [];
  };

  const getPrimaryVariation = (item: any) => {
    const variations = getVariations(item);

    if (variations.length > 0) {
      return variations[0];
    }

    return {
      price: item.price || null,
      pieces: item.pieces || null,
      coverage: item.coverage || null,
      inStock: item.inStock || false,
    };
  };

  const getProductName = (item: any) => {
    return item.priceData?.name || item.name || item.title || "Unnamed Product";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PackageSearch className="text-blue-600" size={28} />

              <h1 className="text-2xl font-bold capitalize">{site}</h1>
            </div>

            <button
              onClick={refreshAllProducts}
              disabled={refreshingAll}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-sm font-medium"
            >
              {refreshingAll ? "Refreshing..." : "Refresh All"}
            </button>
          </div>
        </div>

        {/* FETCH BOX */}
        <div className="bg-white p-6 rounded-2xl shadow-sm space-y-5">
          {/* TABS */}
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab("sitemap")}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === "sitemap"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100"
              }`}
            >
              Fetch Sitemap
            </button>

            <button
              onClick={() => setActiveTab("product")}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === "product"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100"
              }`}
            >
              Fetch Product
            </button>
          </div>

          {/* SITEMAP TAB */}
          {activeTab === "sitemap" && (
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter sitemap URL..."
                value={sitemapUrl}
                onChange={(e) => setSitemapUrl(e.target.value)}
                className="border border-gray-400 p-3 flex-1 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                onClick={fetchSitemap}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-xl flex items-center gap-2"
              >
                <Boxes size={18} />

                {loading ? "Fetching..." : "Fetch"}
              </button>
            </div>
          )}

          {/* PRODUCT TAB */}
          {activeTab === "product" && (
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter product URL..."
                value={singleUrl}
                onChange={(e) => setSingleUrl(e.target.value)}
                className="border border-gray-400 p-3 flex-1 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                onClick={fetchSingleProduct}
                className="bg-green-600 hover:bg-green-700 text-white px-5 rounded-xl flex items-center gap-2"
              >
                <Plus size={18} />

                {singleLoading ? "Fetching..." : "Fetch Product"}
              </button>
            </div>
          )}
        </div>

        {/* TREE + FILTER */}
        {fetchedUrls.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* HEADER */}
            <button
              onClick={() => setSectionsOpen(!sectionsOpen)}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition"
            >
              <div>
                <h2 className="font-semibold text-left">Sitemap Results</h2>

                <p className="text-sm text-gray-500">
                  {fetchedUrls.length} URLs
                </p>
              </div>

              {sectionsOpen ? (
                <ChevronDown size={20} />
              ) : (
                <ChevronRight size={20} />
              )}
            </button>

            {/* CONTENT */}
            {sectionsOpen && (
              <div className="p-5 border-t space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* TREE */}
                  <div className="bg-gray-50 p-5 rounded-2xl max-h-[500px] overflow-auto">
                    <h2 className="font-semibold mb-4">Categories</h2>

                    {Object.entries(tree).map(([key, node]) => (
                      <TreeNode
                        key={key}
                        nodeKey={key}
                        node={node}
                        onSelect={(urls) => {
                          setFilteredUrls(urls || []);
                        }}
                      />
                    ))}
                  </div>

                  {/* FILTERED */}
                  {filteredUrls.length > 0 && (
                    <div className="bg-gray-50 p-5 rounded-2xl">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="font-semibold">
                          Filtered ({filteredUrls.length})
                        </h2>

                        <button
                          onClick={() =>
                            setSelectedUrls((prev) => [
                              ...new Set([...prev, ...filteredUrls]),
                            ])
                          }
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm"
                        >
                          <Plus size={16} />
                          Add All
                        </button>
                      </div>

                      <div className="mb-4">
                        <input
                          type="text"
                          placeholder="Search URLs..."
                          value={filteredSearch}
                          onChange={(e) => setFilteredSearch(e.target.value)}
                          className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="max-h-[320px] overflow-auto space-y-2">
                        {searchedFilteredUrls.map((url, i) => (
                          <div
                            key={i}
                            className="flex justify-between items-center text-xs p-2 rounded-lg hover:bg-white"
                          >
                            <span className="flex-1 break-all">{url}</span>

                            <div className="flex items-center gap-3">
                              <button
                                onClick={() =>
                                  setSelectedUrls((prev) =>
                                    prev.includes(url) ? prev : [...prev, url],
                                  )
                                }
                                className="text-green-600"
                              >
                                <Plus size={16} />
                              </button>

                              <Link href={url} target="_blank">
                                <ExternalLink
                                  size={16}
                                  className="text-blue-600"
                                />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* SELECTED */}
                <div className="bg-gray-50 p-5 rounded-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold">
                      Selected ({selectedUrls.length})
                    </h2>

                    <button
                      onClick={saveSelected}
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm"
                    >
                      <Save size={16} />

                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>

                  <div className="max-h-[400px] overflow-auto space-y-2">
                    {selectedUrls.length === 0 ? (
                      <div className="text-sm text-gray-500 text-center py-8">
                        No URLs selected
                      </div>
                    ) : (
                      selectedUrls.map((url, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center text-xs p-2 rounded-lg hover:bg-white"
                        >
                          <button
                            onClick={() => toggleUrl(url)}
                            className="text-red-500"
                          >
                            <X size={16} />
                          </button>

                          <span className="flex-1 mx-3 break-all">{url}</span>

                          <Link href={url} target="_blank">
                            <ExternalLink size={16} className="text-blue-600" />
                          </Link>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PRODUCTS */}
        <div className="grid md:grid-cols-3 gap-5">
          {urls.map((item) => {
            const variation = getPrimaryVariation(item);
            const variations = getVariations(item);
            console.log(item._id);
            console.log(comparisonMap);
            console.log(
              item.url?.toLowerCase()?.replace(/\/$/, "")?.split("?")[0],
            );
            return (
              <div
                key={item._id}
                className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition relative"
              >
                {/* DELETE */}
                <button
                  onClick={() => deleteProduct(item._id)}
                  className="absolute top-3 z-10 rounded-full bg-red-600 p-2 cursor-pointer right-3 text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} color="white" />
                </button>

                {/* REFRESH */}
                <button
                  onClick={() => refreshProduct(item._id)}
                  className="absolute top-3 z-10 rounded-full bg-blue-600 w-[33px] h-[33px] pb-1 flex justify-center items-center cursor-pointer right-12 text-white"
                >
                  {refreshingId === item._id ? "..." : "↻"}
                </button>

                {/* IMAGE */}
                {item.image && (
                  <div className="relative h-44 mb-4">
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      className="object-cover rounded-xl"
                      unoptimized
                    />
                    {comparisonMap[
                      item.url?.toLowerCase()?.replace(/\/$/, "")?.split("?")[0]
                    ]?.exists ? (
                      <div className="absolute top-3 left-3 bg-green-600 text-white text-xs px-3 py-1 rounded-full z-10">
                        Compared (
                        {
                          comparisonMap[
                            item.url
                              ?.toLowerCase()
                              ?.replace(/\/$/, "")
                              ?.split("?")[0]
                          ]?.count
                        }
                        )
                      </div>
                    ) : (
                      <div className="absolute top-3 left-3 bg-gray-400 text-white text-xs px-3 py-1 rounded-full z-10">
                        Not Compared
                      </div>
                    )}
                  </div>
                )}

                {/* TITLE */}
                <p className="text-sm font-semibold line-clamp-2 min-h-[40px]">
                  {getProductName(item)}
                </p>

                {/* PRICE + INFO */}
                <div className="mt-4 space-y-2">
                  {variation?.price && (
                    <p className="text-3xl font-bold text-green-600">
                      £{variation.price}
                    </p>
                  )}

                  <p className="text-xs text-gray-500">
                    {variation?.pieces && `${variation.pieces} pcs`}

                    {variation?.pieces && variation?.coverage && " • "}

                    {variation?.coverage && `${variation.coverage}m²`}
                  </p>

                  <p
                    className={`text-xs font-medium ${
                      variation?.inStock ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {variation?.inStock ? "In Stock" : "Out of Stock"}
                  </p>

                  {/* VARIATIONS BUTTON */}
                  {variations.length > 0 && (
                    <button
                      onClick={() => setSelectedProduct(item)}
                      className="text-xs cursor-pointer bg-blue-50 text-blue-600 px-3 py-2 rounded-xl hover:bg-blue-100 mt-2"
                    >
                      View Variations ({variations.length})
                    </button>
                  )}
                </div>

                {/* LINK */}
                <div className="flex justify-between items-center mt-4">
                  <a
                    href={item.url}
                    target="_blank"
                    className="text-sm text-blue-600  inline-flex items-center gap-1"
                  >
                    View Product
                    <ExternalLink size={14} />
                  </a>
                  <button
                    onClick={() => {
                      setSelectedCompetitor(item);
                      setComparisonOpen(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700"
                  >
                    Compare
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden">
            {/* HEADER */}
            <div className="flex justify-between items-start p-6 border-b">
              <div>
                <h2 className="text-xl font-bold">
                  {getProductName(selectedProduct)}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {getVariations(selectedProduct).length} variations
                </p>
              </div>

              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-500 hover:text-black"
              >
                <X size={22} />
              </button>
            </div>

            {/* BODY */}
            <div className="p-6 overflow-y-auto max-h-[75vh] space-y-4">
              {getVariations(selectedProduct).map((v: any, idx: number) => (
                <div key={idx} className="border rounded-2xl p-5 bg-gray-50">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {v.label || `Variation ${idx + 1}`}
                      </p>

                      {v.size && (
                        <p className="text-sm text-gray-500 mt-1">{v.size}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        £{v.price ?? "-"}
                      </p>

                      {v.pricePerM2 && (
                        <p className="text-xs text-gray-500">
                          £{v.pricePerM2}/m²
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="bg-white rounded-xl p-3 border">
                      <p className="text-gray-500 text-xs">Coverage</p>

                      <p className="font-semibold">
                        {v.coverage ? `${v.coverage}m²` : "-"}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-3 border">
                      <p className="text-gray-500 text-xs">Pieces</p>

                      <p className="font-semibold">{v.pieces ?? "-"}</p>
                    </div>

                    <div className="bg-white rounded-xl p-3 border">
                      <p className="text-gray-500 text-xs">SKU</p>

                      <p className="font-semibold break-all">{v.sku || "-"}</p>
                    </div>

                    <div className="bg-white rounded-xl p-3 border">
                      <p className="text-gray-500 text-xs">Stock</p>

                      <p
                        className={`font-semibold ${
                          v.inStock ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {v.inStock ? "In Stock" : "Out of Stock"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ComparisonModal
        open={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
        preselectedCompetitor={selectedCompetitor}
      />
    </div>
  );
}
