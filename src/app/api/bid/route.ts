import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token, bids } = body as {
    token: string;
    bids: { roomId: string; value: number }[];
  };

  if (!token || !bids || bids.length !== 3) {
    return NextResponse.json({ error: "Invalid bid submission" }, { status: 400 });
  }

  // Look up participant
  const { data: participant, error: pError } = await supabase
    .from("participants")
    .select("*, auctions(*)")
    .eq("access_token", token)
    .single();

  if (pError || !participant) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  if (participant.auctions.status === "completed") {
    return NextResponse.json({ error: "Auction already completed" }, { status: 400 });
  }

  // Validate all bid values are non-negative
  for (const bid of bids) {
    if (bid.value < 0) {
      return NextResponse.json({ error: "Bids must be non-negative" }, { status: 400 });
    }
  }

  // Upsert bids (allows re-submission before auction closes)
  for (const bid of bids) {
    const { error } = await supabase
      .from("bids")
      .upsert(
        {
          participant_id: participant.id,
          room_id: bid.roomId,
          value: bid.value,
        },
        { onConflict: "participant_id,room_id" }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Mark participant as submitted
  await supabase
    .from("participants")
    .update({ has_submitted: true })
    .eq("id", participant.id);

  return NextResponse.json({ success: true });
}
