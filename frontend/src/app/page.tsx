"use client";

import { useRouter } from "next/navigation";

const sites = [
  { name: "NuStone", key: "nustone" },
  { name: "Universal Paving", key: "universal" },
  { name: "Natural Paving", key: "natural" },
  { name: "Pave Direct", key: "pavedirect" },
];

export default function Home() {
  const router = useRouter();

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">📊 Price Tracker Dashboard</h1>

      <div className="grid grid-cols-2 gap-4">
        {sites.map((site) => (
          <div
            key={site.key}
            onClick={() => router.push(`/site/${site.key}`)}
            className="p-6 border rounded-xl cursor-pointer hover:bg-gray-100"
          >
            <h2 className="text-xl font-semibold">{site.name}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}