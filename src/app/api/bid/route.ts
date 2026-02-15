import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token, bids } = body as {
    token: string;
    bids: { roomId: string; value: number }[];
  };

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!bids || !Array.isArray(bids) || bids.length !== 3) {
    return NextResponse.json({ error: "Must bid on all 3 rooms" }, { status: 400 });
  }

  // Look up participant by token
  const { data: participant, error: pError } = await supabase
    .from("participants")
    .select("*, auctions(*)")
    .eq("access_token", token)
    .single();

  if (pError || !participant) {
    // Generic error — don't reveal whether token exists
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (participant.auctions.status === "completed") {
    return NextResponse.json({ error: "Auction already completed" }, { status: 400 });
  }

  // Fetch the actual room IDs for this auction to validate against
  const { data: auctionRooms } = await supabase
    .from("rooms")
    .select("id")
    .eq("auction_id", participant.auction_id);

  const validRoomIds = new Set((auctionRooms || []).map((r) => r.id));
  const rentTotal = Number(participant.auctions.rent_total);

  // Validate each bid
  for (const bid of bids) {
    if (typeof bid.value !== "number" || isNaN(bid.value) || bid.value < 0) {
      return NextResponse.json({ error: "Bids must be non-negative numbers" }, { status: 400 });
    }
    if (bid.value > rentTotal * 2) {
      return NextResponse.json({ error: "Bid exceeds reasonable maximum" }, { status: 400 });
    }
    if (!validRoomIds.has(bid.roomId)) {
      return NextResponse.json({ error: "Invalid room" }, { status: 400 });
    }
  }

  // Verify all 3 rooms are covered (no duplicates, no missing)
  const biddedRooms = new Set(bids.map((b) => b.roomId));
  if (biddedRooms.size !== 3) {
    return NextResponse.json({ error: "Must bid on each room exactly once" }, { status: 400 });
  }

  // Upsert bids
  for (const bid of bids) {
    const { error } = await supabase
      .from("bids")
      .upsert(
        {
          participant_id: participant.id,
          room_id: bid.roomId,
          value: Math.round(bid.value * 100) / 100,
        },
        { onConflict: "participant_id,room_id" }
      );

    if (error) {
      return NextResponse.json({ error: "Failed to save bid" }, { status: 500 });
    }
  }

  // Mark participant as submitted
  await supabase
    .from("participants")
    .update({ has_submitted: true })
    .eq("id", participant.id);

  return NextResponse.json({ success: true });
}
