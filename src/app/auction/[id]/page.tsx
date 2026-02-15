"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Auction, Participant } from "@/lib/types";
import FloorplanViewer from "@/components/FloorplanViewer";
import StatusBoard from "@/components/StatusBoard";

export default function AuctionDashboard() {
  const params = useParams();
  const router = useRouter();
  const auctionId = params.id as string;

  const [auction, setAuction] = useState<Auction | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [solving, setSolving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [auctionRes, participantsRes] = await Promise.all([
      supabase.from("auctions").select().eq("id", auctionId).single(),
      supabase.from("participants").select().eq("auction_id", auctionId),
    ]);

    if (auctionRes.data) setAuction(auctionRes.data);
    if (participantsRes.data) setParticipants(participantsRes.data);
    setLoading(false);
  }, [auctionId]);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`auction-${auctionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "participants", filter: `auction_id=eq.${auctionId}` },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "auctions", filter: `id=eq.${auctionId}` },
        (payload) => {
          if (payload.new && (payload.new as Auction).status === "completed") {
            router.push(`/auction/${auctionId}/results`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [auctionId, fetchData, router]);

  const allSubmitted = participants.length > 0 && participants.every((p) => p.has_submitted);

  const handleSolve = async () => {
    setSolving(true);
    setError("");
    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auctionId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to solve");
      }
      router.push(`/auction/${auctionId}/results`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSolving(false);
    }
  };

  const copyLink = (token: string, name: string) => {
    const url = `${window.location.origin}/bid/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(name);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading auction...</div>
      </main>
    );
  }

  if (!auction) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-red-500 text-sm">Auction not found.</div>
      </main>
    );
  }

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
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full">
              ${Number(auction.rent_total).toLocaleString()}/mo
            </span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              auction.status === "completed"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}>
              {auction.status === "completed" ? "Completed" : "Bidding"}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 mb-1">Auction Dashboard</h1>
          <p className="text-zinc-500 text-sm">
            Share bidding links with your roommates and track submissions in real-time.
          </p>
        </div>

        {/* Floorplan */}
        <div className="max-w-3xl mb-8">
          <FloorplanViewer />
        </div>

        {/* Two-column layout */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Share links */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100">
              <h3 className="font-semibold text-zinc-900">Invite Links</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Each person gets a unique, private link
              </p>
            </div>
            <div className="divide-y divide-zinc-50">
              {participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="min-w-0">
                    <div className="font-medium text-zinc-900 text-sm">{p.name}</div>
                    <div className="text-xs text-zinc-400 truncate">{p.email}</div>
                  </div>
                  <button
                    onClick={() => copyLink(p.access_token, p.name)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex-shrink-0 ml-3 ${
                      copied === p.name
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-zinc-900 text-white hover:bg-zinc-800"
                    }`}
                  >
                    {copied === p.name ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <StatusBoard participants={participants} />
        </div>

        {/* Calculate button */}
        <div className="flex flex-col items-center">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-3 text-sm font-medium mb-4 max-w-md w-full text-center">
              {error}
            </div>
          )}
          <button
            onClick={handleSolve}
            disabled={!allSubmitted || solving}
            className={`px-8 py-3.5 font-semibold rounded-xl shadow-sm transition-all ${
              allSubmitted
                ? "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800"
                : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
            }`}
          >
            {solving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Calculating...
              </span>
            ) : allSubmitted ? (
              "Calculate Fair Prices"
            ) : (
              "Waiting for all bids..."
            )}
          </button>
          {!allSubmitted && (
            <p className="text-xs text-zinc-400 mt-2">
              All roommates must submit before results can be calculated
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
