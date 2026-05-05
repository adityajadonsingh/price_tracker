"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function collectAllUrls(node: any): string[] {
  let urls = [...(node.__urls || [])];

  Object.values(node.__children || {}).forEach((child: any) => {
    urls = [...urls, ...collectAllUrls(child)];
  });

  return urls;
}

/* 🔥 TREE NODE COMPONENT */
function TreeNode({ nodeKey, node, onSelect }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="ml-3">
      {" "}
      <div className="flex items-center gap-2">
        <button onClick={() => setOpen(!open)} className="text-xs w-4">
          {open ? "▼" : "▶"}{" "}
        </button>

        <span
          className="cursor-pointer text-sm hover:text-blue-600"
          onClick={() => onSelect(collectAllUrls(node))}
        >
          {nodeKey}
        </span>
      </div>
      {open && (
        <div className="ml-4 border-l pl-2">
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
  const [urls, setUrls] = useState<any[]>([]);
  const [tree, setTree] = useState<any>({});
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [fetchedUrls, setFetchedUrls] = useState<string[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isAllSelected =
    fetchedUrls.length > 0 && selectedUrls.length === fetchedUrls.length;

  const handleSelectAll = () => {
    if (isAllSelected) setSelectedUrls([]);
    else setSelectedUrls([...fetchedUrls]);
  };

  /* 🟢 FETCH SAVED PRODUCTS */
  const fetchSavedUrls = async () => {
    const res = await fetch(`http://localhost:5000/api/urls/${site}`);
    const data = await res.json();
    setUrls(data);
  };

  useEffect(() => {
    fetchSavedUrls();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchSavedUrls, 5000);
    return () => clearInterval(interval);
  }, []);

  /* 🟢 LOAD STORED SITEMAP */
  const loadSitemap = async () => {
    const res = await fetch(`http://localhost:5000/api/sitemap/${site}`);
    const data = await res.json();

    setFetchedUrls(data.urls || []);
    setTree(data.tree || {});
  };

  useEffect(() => {
    loadSitemap();
  }, []);

  /* 🟢 FETCH SITEMAP */
  const fetchSitemap = async () => {
    if (!sitemapUrl) return;

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/sitemap/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sitemapUrl, site }),
      });

      const data = await res.json();

      setFetchedUrls(data.urls || []);
      setSelectedUrls(data.urls || []);
      setTree(data.tree || {});
    } finally {
      setLoading(false);
    }
  };

  /* 🟢 TOGGLE */
  const toggleUrl = (url: string) => {
    setSelectedUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url],
    );
  };

  /* 🟢 SAVE */
  const saveSelected = async () => {
    if (!selectedUrls.length) return;

    setSaving(true);

    try {
      await fetch("http://localhost:5000/api/urls/save", {
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {" "}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h1 className="text-2xl font-bold capitalize">{site}</h1>
        </div>

        {/* SITEMAP INPUT */}
        <div className="bg-white p-6 rounded-xl shadow flex gap-3">
          <input
            type="text"
            placeholder="Enter sitemap URL..."
            value={sitemapUrl}
            onChange={(e) => setSitemapUrl(e.target.value)}
            className="border p-2 flex-1 rounded"
          />

          <button
            onClick={fetchSitemap}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {loading ? "Fetching..." : "Fetch"}
          </button>
        </div>

        {/* TREE + SELECT UI */}
        {fetchedUrls.length > 0 && (
          <>
            <div className="grid md:grid-cols-2 gap-6">
              {/* TREE */}
              <div className="bg-white p-4 rounded-xl shadow max-h-[500px] overflow-auto">
                <h2 className="font-semibold mb-3">Categories</h2>

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

              {/* URL LIST */}

              {filteredUrls.length > 0 && (
                <div className="bg-white p-4 rounded-xl shadow">
                  <div className="flex justify-between mb-3">
                    <h2 className="font-semibold">
                      Filtered ({filteredUrls.length})
                    </h2>

                    <button
                      onClick={() =>
                        setSelectedUrls((prev) => [
                          ...new Set([...prev, ...filteredUrls]),
                        ])
                      }
                      className="bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      Add All
                    </button>
                  </div>

                  <div className="max-h-[300px] overflow-auto space-y-1">
                    {filteredUrls.map((url, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-xs p-1 hover:bg-gray-50"
                      >
                        <span className="flex-1 break-all">{url}</span>

                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              setSelectedUrls((prev) =>
                                prev.includes(url) ? prev : [...prev, url],
                              )
                            }
                            className="text-green-600"
                          >
                            ➕
                          </button>

                          <Link href={url} target="_blank">
                            🔗
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6">
              <div className="bg-white p-4 rounded-xl shadow">
                <div className="flex justify-between mb-3">
                  <h2 className="font-semibold">
                    Selected ({selectedUrls.length})
                  </h2>

                  <button
                    onClick={saveSelected}
                    disabled={saving}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>

                {/* SELECT ALL */}
                <div className="flex justify-between mb-2 text-sm">
                  <label className="flex gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                    />
                    {isAllSelected ? "Unselect All" : "Select All"}
                  </label>

                  <span>
                    {selectedUrls.length}/{fetchedUrls.length}
                  </span>
                </div>

                <div className="max-h-[400px] overflow-auto space-y-1">
                  {fetchedUrls.map((url, i) => (
                    <div
                      key={i}
                      className="flex justify-between text-xs p-1 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUrls.includes(url)}
                        onChange={() => toggleUrl(url)}
                      />

                      <span className="flex-1 mx-2 break-all">{url}</span>

                      <Link href={url} target="_blank">
                        🔗
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* SAVED PRODUCTS */}
        <div className="grid md:grid-cols-3 gap-4">
          {urls.map((item) => (
            <div
              key={item._id}
              className="bg-white p-4 rounded-xl shadow hover:shadow-md transition"
            >
              {item.image && (
                <div className="relative h-40 mb-2">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    className="object-cover rounded"
                    unoptimized
                  />
                </div>
              )}

              <p className="text-sm font-semibold">
                {item.priceData?.name || item.title}
              </p>

              {item.priceData && (
                <div className="mt-2">
                  <p className="text-lg font-bold text-green-600">
                    £{item.priceData.price}
                  </p>

                  <p className="text-xs text-gray-600">
                    {item.priceData.pieces && `${item.priceData.pieces} pcs`}
                    {item.priceData.pieces && item.priceData.coverage && " • "}
                    {item.priceData.coverage && `${item.priceData.coverage}m²`}
                  </p>
                </div>
              )}

              <a
                href={item.url}
                target="_blank"
                className="text-xs text-blue-600 mt-2 block"
              >
                View →
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
