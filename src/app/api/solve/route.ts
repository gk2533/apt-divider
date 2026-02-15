import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { solveRentDivision } from "@/lib/solver";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { auctionId, token } = body as { auctionId: string; token?: string };

  if (!auctionId || typeof auctionId !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Authorization: require a valid participant token for this auction
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: caller } = await supabase
    .from("participants")
    .select("auction_id")
    .eq("access_token", token)
    .single();

  if (!caller || caller.auction_id !== auctionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch auction with row-level lock check
  const { data: auction, error: aErr } = await supabase
    .from("auctions")
    .select()
    .eq("id", auctionId)
    .single();

  if (aErr || !auction) {
    return NextResponse.json({ error: "Auction not found" }, { status: 404 });
  }

  if (auction.status === "completed") {
    return NextResponse.json({ error: "Auction already completed" }, { status: 400 });
  }

  // Fetch rooms
  const { data: rooms } = await supabase
    .from("rooms")
    .select()
    .eq("auction_id", auctionId)
    .order("sort_order");

  if (!rooms || rooms.length !== 3) {
    return NextResponse.json({ error: "Invalid auction configuration" }, { status: 500 });
  }

  // Fetch participants
  const { data: participants } = await supabase
    .from("participants")
    .select()
    .eq("auction_id", auctionId);

  if (!participants || participants.length !== 3) {
    return NextResponse.json({ error: "Invalid auction configuration" }, { status: 500 });
  }

  // Check all have submitted
  if (!participants.every((p) => p.has_submitted)) {
    return NextResponse.json({ error: "Not all participants have submitted bids" }, { status: 400 });
  }

  // Fetch all bids
  const { data: allBids } = await supabase
    .from("bids")
    .select()
    .in("participant_id", participants.map((p) => p.id));

  if (!allBids) {
    return NextResponse.json({ error: "Failed to fetch bids" }, { status: 500 });
  }

  // Build bids matrix
  const roomIds = rooms.map((r) => r.id);
  const participantIds = participants.map((p) => p.id);

  const bidsMatrix: number[][] = participantIds.map((pid) => {
    return roomIds.map((rid) => {
      const bid = allBids.find((b) => b.participant_id === pid && b.room_id === rid);
      return bid ? Number(bid.value) : 0;
    });
  });

  // Solve
  const result = solveRentDivision({
    rentTotal: Number(auction.rent_total),
    bids: bidsMatrix,
    participantIds,
    roomIds,
  });

  // Clear old results and store new
  await supabase.from("results").delete().eq("auction_id", auctionId);

  const resultInserts = result.assignment.map((a) => ({
    auction_id: auctionId,
    participant_id: a.participantId,
    assigned_room_id: a.roomId,
    price: a.price,
    utility: a.utility,
  }));

  const { error: rErr } = await supabase.from("results").insert(resultInserts);
  if (rErr) {
    return NextResponse.json({ error: "Failed to save results" }, { status: 500 });
  }

  // Mark auction as completed
  await supabase
    .from("auctions")
    .update({ status: "completed" })
    .eq("id", auctionId);

  return NextResponse.json(result);
}
