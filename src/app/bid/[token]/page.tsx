"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Auction, Participant, Room } from "@/lib/types";
import FloorplanViewer from "@/components/FloorplanViewer";
import BidForm from "@/components/BidForm";

export default function BidPage() {
  const params = useParams();
  const token = params.token as string;

  const [participant, setParticipant] = useState<Participant | null>(null);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/participant?token=${encodeURIComponent(token)}`);
      if (!res.ok) {
        setError("Invalid bidding link.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setParticipant(data.participant);
      setSubmitted(data.participant.has_submitted);
      setAuction(data.auction);
      setRooms(data.rooms);
    } catch {
      // network error — will retry on next poll
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchData();
    // Poll every 5 seconds for auction status updates
    pollRef.current = setInterval(fetchData, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchData]);

  const handleSubmit = async (bids: { roomId: string; value: number }[]) => {
    const res = await fetch("/api/bid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, bids }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to submit bids");
    }

    setSubmitted(true);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading...</div>
      </main>
    );
  }

  if (error || !participant || !auction) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-red-600 font-medium">{error || "Something went wrong."}</p>
        </div>
      </main>
    );
  }

  const isCompleted = auction.status === "completed";
  const rentTotal = Number(auction.rent_total);

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
            <a href="/about" className="text-xs text-zinc-400 hover:text-zinc-600 font-medium transition-colors">
              How it works
            </a>
            <span className="text-sm font-mono text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full">
              ${rentTotal.toLocaleString()}/mo
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-zinc-900">{participant.name}</h1>
            <span className="text-xs font-medium text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
              {participant.email}
            </span>
          </div>
          <p className="text-zinc-500 text-sm">
            Total rent is <span className="font-mono font-semibold text-zinc-700">${rentTotal.toLocaleString()}</span>/mo
            {" "}&middot; Average <span className="font-mono font-semibold text-zinc-700">${Math.round(rentTotal / 3).toLocaleString()}</span>/person
          </p>
        </div>

        {/* Floorplan */}
        <div className="max-w-3xl mb-8">
          <FloorplanViewer />
        </div>

        {/* State-dependent content */}
        {isCompleted ? (
          <div className="max-w-md mx-auto">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-emerald-900 mb-2">Results Are In</h2>
              <p className="text-emerald-700 text-sm mb-5">
                The auction has been completed. See who got which room and at what price.
              </p>
              <a
                href={`/auction/${auction.id}/results`}
                className="inline-block px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 shadow-sm"
              >
                View Results
              </a>
            </div>
          </div>
        ) : submitted ? (
          <div className="max-w-md mx-auto">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-blue-900 mb-2">Bids Locked In</h2>
              <p className="text-blue-700 text-sm">
                Waiting for your roommates to submit their bids.
                This page will update automatically when results are ready.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-lg mx-auto">
            <BidForm rooms={rooms} rentTotal={rentTotal} onSubmit={handleSubmit} />
          </div>
        )}
      </div>
    </main>
  );
}
