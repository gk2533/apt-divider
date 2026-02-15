"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FloorplanViewer from "@/components/FloorplanViewer";

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [rentTotal, setRentTotal] = useState("8150");
  const [people, setPeople] = useState([
    { name: "", email: "" },
    { name: "", email: "" },
    { name: "", email: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const rent = parseFloat(rentTotal) || 0;
  const avgRent = rent > 0 ? Math.round(rent / 3) : 0;

  const handleCreate = async () => {
    setError("");

    if (rent <= 0) {
      setError("Please enter a valid rent amount.");
      return;
    }

    for (const p of people) {
      if (!p.name.trim() || !p.email.trim()) {
        setError("Please fill in all names and emails.");
        return;
      }
      if (!/\S+@\S+\.\S+/.test(p.email.trim())) {
        setError(`"${p.email}" doesn't look like a valid email.`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rentTotal: rent,
          participants: people.map((p) => ({
            name: p.name.trim(),
            email: p.email.trim(),
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create auction");
      }

      const data = await res.json();
      router.push(`/auction/${data.auctionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      {/* Top bar */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="font-semibold text-zinc-900 text-lg tracking-tight">Apt Divider</span>
          </div>
          <span className="text-xs text-zinc-400 font-medium">Envy-Free Room Auction</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 tracking-tight mb-3">
            Split your apartment fairly
          </h1>
          <p className="text-zinc-500 text-lg max-w-xl mx-auto">
            An envy-free auction that assigns rooms and prices so no one would trade.
            Mathematically guaranteed fairness.
          </p>
        </div>

        {/* Floorplan */}
        <div className="max-w-3xl mx-auto mb-10">
          <FloorplanViewer />
        </div>

        {/* Steps indicator */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                ${step === 1 ? "bg-zinc-900 text-white shadow-sm" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">1</span>
              Set Rent
            </button>
            <div className="w-8 h-px bg-zinc-200" />
            <button
              onClick={() => rent > 0 ? setStep(2) : null}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                ${step === 2 ? "bg-zinc-900 text-white shadow-sm" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}
                ${rent <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">2</span>
              Add Roommates
            </button>
          </div>
        </div>

        {/* Form card */}
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            {step === 1 && (
              <div className="p-6 md:p-8">
                <h2 className="text-xl font-semibold text-zinc-900 mb-1">Monthly Rent</h2>
                <p className="text-sm text-zinc-500 mb-6">
                  Enter the total rent for the apartment. You can change this later if you get a different offer.
                </p>

                <div className="relative mb-2">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-2xl">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={rentTotal}
                    onChange={(e) => setRentTotal(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 pl-12 pr-16 py-4 text-3xl font-mono font-bold text-zinc-900
                      focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent
                      placeholder:text-zinc-300"
                    placeholder="0"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-medium">/month</span>
                </div>

                {avgRent > 0 && (
                  <p className="text-sm text-zinc-400 mb-6">
                    That&apos;s <span className="font-mono font-semibold text-zinc-600">${avgRent.toLocaleString()}</span> per person if split equally
                  </p>
                )}

                <button
                  onClick={() => rent > 0 && setStep(2)}
                  disabled={rent <= 0}
                  className="w-full py-3.5 bg-zinc-900 text-white font-semibold rounded-xl
                    hover:bg-zinc-800 active:bg-zinc-950 disabled:opacity-40 disabled:cursor-not-allowed
                    shadow-sm"
                >
                  Continue
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-xl font-semibold text-zinc-900">Roommates</h2>
                  <span className="text-sm font-mono text-zinc-400">${rent.toLocaleString()}/mo</span>
                </div>
                <p className="text-sm text-zinc-500 mb-6">
                  Add each roommate&apos;s name and email. They&apos;ll receive a private link to submit their bids.
                </p>

                <div className="space-y-4 mb-6">
                  {people.map((person, i) => (
                    <div key={i} className="rounded-xl border border-zinc-200 p-4 bg-zinc-50/50">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-500">
                          {i + 1}
                        </div>
                        <span className="text-sm font-medium text-zinc-500">Roommate {i + 1}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Name"
                          value={person.name}
                          onChange={(e) => {
                            const updated = [...people];
                            updated[i] = { ...updated[i], name: e.target.value };
                            setPeople(updated);
                          }}
                          className="border border-zinc-300 rounded-lg px-3.5 py-2.5 text-sm font-medium text-zinc-900
                            placeholder:text-zinc-400 placeholder:font-normal
                            focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent bg-white"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={person.email}
                          onChange={(e) => {
                            const updated = [...people];
                            updated[i] = { ...updated[i], email: e.target.value };
                            setPeople(updated);
                          }}
                          className="border border-zinc-300 rounded-lg px-3.5 py-2.5 text-sm font-medium text-zinc-900
                            placeholder:text-zinc-400 placeholder:font-normal
                            focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-3 text-sm font-medium mb-4">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="px-5 py-3.5 border border-zinc-200 text-zinc-600 font-medium rounded-xl
                      hover:bg-zinc-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="flex-1 py-3.5 bg-zinc-900 text-white font-semibold rounded-xl
                      hover:bg-zinc-800 active:bg-zinc-950 disabled:opacity-40 disabled:cursor-not-allowed
                      shadow-sm"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      "Create Auction & Send Invites"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
