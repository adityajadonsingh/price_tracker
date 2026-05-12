"use client";

import { LayoutListIcon, List, Plus } from "lucide-react";
import Link from "next/dist/client/link";
import { useRouter } from "next/navigation";

const sites = [
  { name: "Stonecera", key: "stonecera" },
  { name: "NuStone", key: "nustone" },
  { name: "Universal Paving", key: "universal" },
  // { name: "Natural Paving", key: "natural" },
];

export default function Home() {
  const router = useRouter();

  return (
    <div className="p-10 bg-gray-50 min-h-screen">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold mb-6">📊 Price Tracker Dashboard</h1>
        <div className="flex gap-x-3">
          <Link href="/comparison">
            <button className="ml-auto px-4 font-bold cursor-pointer py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              <Plus className="inline -mt-1 mr-1" /> Add Product to Compare
              Prices
            </button>
          </Link>
          <Link href="/comparison/list">
            <button className="ml-auto px-4 font-bold cursor-pointer py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              <LayoutListIcon size={16}
               className="inline -mt-1 mr-1" /> Compared Product List
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {sites.map((site) => (
          <div
            key={site.key}
            onClick={() => router.push(`/site/${site.key}`)}
            className="p-6 shadow-sm rounded-xl cursor-pointer bg-white hover:bg-gray-100"
          >
            <h2 className="text-xl font-semibold">{site.name}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}
