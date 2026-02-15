"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Auction, Participant } from "@/lib/types";
import FloorplanViewer from "@/components/FloorplanViewer";
import StatusBoard from "@/components/StatusBoard";

interface StoredParticipant {
  name: string;
  email: string;
  token: string;
}

export default function AuctionDashboard() {
  const params = useParams();
  const router = useRouter();
  const auctionId = params.id as string;

  const [auction, setAuction] = useState<Auction | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [storedParticipants, setStoredParticipants] = useState<StoredParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [solving, setSolving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load stored participant tokens from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`auction_participants_${auctionId}`);
    if (stored) {
      try {
        setStoredParticipants(JSON.parse(stored));
      } catch {
        // ignore parse errors
      }
    }
  }, [auctionId]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/auction/${auctionId}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setAuction(data.auction);
      setParticipants(data.participants);

      // Redirect to results if completed
      if (data.auction?.status === "completed") {
        router.push(`/auction/${auctionId}/results`);
      }
    } catch {
      // network error — will retry on next poll
    }
    setLoading(false);
  }, [auctionId, router]);

  useEffect(() => {
    fetchData();
    // Poll every 5 seconds for status updates (replaces realtime subscription)
    pollRef.current = setInterval(fetchData, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchData]);

  const allSubmitted = participants.length > 0 && participants.every((p) => p.has_submitted);

  const handleSolve = async () => {
    setSolving(true);
    setError("");
    try {
      // Use a stored participant token for authorization
      const authToken = storedParticipants[0]?.token;
      if (!authToken) {
        throw new Error("No authorization token available. You must access this page from the auction creation flow.");
      }
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auctionId, token: authToken }),
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

  const getToken = (participantName: string, participantEmail: string) => {
    const stored = storedParticipants.find(
      (sp) => sp.name === participantName && sp.email === participantEmail
    );
    return stored?.token;
  };

  const copyLink = (participantName: string, participantEmail: string) => {
    const token = getToken(participantName, participantEmail);
    if (!token) return;
    const url = `${window.location.origin}/bid/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(participantName);
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

  const hasTokens = storedParticipants.length > 0;

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      {/* Top bar */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <a href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="font-semibold text-zinc-900 text-lg tracking-tight">Apt Divider</span>
            </a>
          </div>
          <div className="flex items-center gap-3">
            <a href="/about" className="text-xs text-zinc-400 hover:text-zinc-600 font-medium transition-colors">
              How it works
            </a>
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
                {hasTokens
                  ? "Each person gets a unique, private link"
                  : "Links were shared when this auction was created"}
              </p>
            </div>
            <div className="divide-y divide-zinc-50">
              {participants.map((p) => {
                const token = getToken(p.name, p.email);
                return (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="min-w-0">
                      <div className="font-medium text-zinc-900 text-sm">{p.name}</div>
                      <div className="text-xs text-zinc-400 truncate">{p.email}</div>
                    </div>
                    {token ? (
                      <button
                        onClick={() => copyLink(p.name, p.email)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex-shrink-0 ml-3 ${
                          copied === p.name
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-zinc-900 text-white hover:bg-zinc-800"
                        }`}
                      >
                        {copied === p.name ? "Copied!" : "Copy Link"}
                      </button>
                    ) : (
                      <span className="text-xs text-zinc-400 ml-3">Link shared</span>
                    )}
                  </div>
                );
              })}
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
            disabled={!allSubmitted || solving || !hasTokens}
            className={`px-8 py-3.5 font-semibold rounded-xl shadow-sm transition-all ${
              allSubmitted && hasTokens
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
