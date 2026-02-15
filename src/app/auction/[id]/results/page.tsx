"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Auction, Participant, Room, Result } from "@/lib/types";
import FloorplanViewer from "@/components/FloorplanViewer";
import ResultsView from "@/components/ResultsView";
import { ROOM_DEFINITIONS } from "@/lib/rooms";

export default function ResultsPage() {
  const params = useParams();
  const auctionId = params.id as string;

  const [auction, setAuction] = useState<Auction | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [bidsMatrix, setBidsMatrix] = useState<number[][] | undefined>();
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [auctionRes, participantsRes, roomsRes, resultsRes] = await Promise.all([
      supabase.from("auctions").select().eq("id", auctionId).single(),
      supabase.from("participants").select().eq("auction_id", auctionId),
      supabase.from("rooms").select().eq("auction_id", auctionId).order("sort_order"),
      supabase.from("results").select().eq("auction_id", auctionId),
    ]);

    if (auctionRes.data) setAuction(auctionRes.data);
    if (participantsRes.data) setParticipants(participantsRes.data);
    if (roomsRes.data) setRooms(roomsRes.data);
    if (resultsRes.data) setResults(resultsRes.data);

    if (participantsRes.data && roomsRes.data) {
      const { data: allBids } = await supabase
        .from("bids")
        .select()
        .in("participant_id", participantsRes.data.map((p) => p.id));

      if (allBids) {
        const matrix = participantsRes.data.map((p) =>
          roomsRes.data!.map((r) => {
            const bid = allBids.find(
              (b) => b.participant_id === p.id && b.room_id === r.id
            );
            return bid ? Number(bid.value) : 0;
          })
        );
        setBidsMatrix(matrix);
      }
    }

    setLoading(false);
  }, [auctionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading results...</div>
      </main>
    );
  }

  if (!auction || results.length === 0) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 mb-2">No results yet.</p>
          <a href={`/auction/${auctionId}`} className="text-sm text-blue-600 font-medium hover:underline">
            Go to dashboard
          </a>
        </div>
      </main>
    );
  }

  const roomPrices: Record<string, number> = {};
  const assignedRooms: Record<string, string> = {};

  for (const result of results) {
    const room = rooms.find((r) => r.id === result.assigned_room_id);
    const participant = participants.find((p) => p.id === result.participant_id);
    if (room && participant) {
      roomPrices[room.key] = Number(result.price);
      assignedRooms[room.key] = participant.name;
    }
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
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full">
              ${Number(auction.rent_total).toLocaleString()}/mo
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
              Complete
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 mb-1">Auction Results</h1>
          <p className="text-zinc-500 text-sm">
            Rooms have been assigned using an envy-free algorithm. Prices sum to exactly{" "}
            <span className="font-mono font-semibold text-zinc-700">${Number(auction.rent_total).toLocaleString()}</span>.
          </p>
        </div>

        {/* Floorplan with results */}
        <div className="max-w-3xl mb-10">
          <FloorplanViewer roomPrices={roomPrices} assignedRooms={assignedRooms} />
        </div>

        {/* Results details */}
        <div className="max-w-xl">
          <ResultsView
            results={results}
            participants={participants}
            rooms={rooms}
            rentTotal={Number(auction.rent_total)}
            bidsMatrix={bidsMatrix}
          />
        </div>
      </div>
    </main>
  );
}
