import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: auctionId } = await params;

  const [auctionRes, participantsRes, roomsRes, resultsRes] = await Promise.all([
    supabase.from("auctions").select().eq("id", auctionId).single(),
    supabase
      .from("participants")
      .select("id, auction_id, name, email, has_submitted")
      .eq("auction_id", auctionId),
    supabase
      .from("rooms")
      .select()
      .eq("auction_id", auctionId)
      .order("sort_order"),
    supabase.from("results").select().eq("auction_id", auctionId),
  ]);

  if (auctionRes.error || !auctionRes.data) {
    return NextResponse.json({ error: "Auction not found" }, { status: 404 });
  }

  // Fetch bids for swap calculator (only after auction is completed)
  let bidsMatrix: number[][] | null = null;
  if (
    auctionRes.data.status === "completed" &&
    participantsRes.data &&
    roomsRes.data
  ) {
    const { data: allBids } = await supabase
      .from("bids")
      .select()
      .in("participant_id", participantsRes.data.map((p) => p.id));

    if (allBids) {
      bidsMatrix = participantsRes.data.map((p) =>
        roomsRes.data!.map((r) => {
          const bid = allBids.find(
            (b) => b.participant_id === p.id && b.room_id === r.id
          );
          return bid ? Number(bid.value) : 0;
        })
      );
    }
  }

  return NextResponse.json({
    auction: auctionRes.data,
    participants: (participantsRes.data || []).map((p) => ({
      id: p.id,
      auction_id: p.auction_id,
      name: p.name,
      email: p.email,
      has_submitted: p.has_submitted,
    })),
    rooms: roomsRes.data || [],
    results: resultsRes.data || [],
    bidsMatrix,
  });
}
