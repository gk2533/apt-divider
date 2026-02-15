import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/participant?token=xxx — fetch participant + auction + rooms by token
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const { data: participant, error } = await supabase
    .from("participants")
    .select("id, auction_id, name, email, has_submitted")
    .eq("access_token", token)
    .single();

  if (error || !participant) {
    // Generic error — don't reveal whether token exists
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }

  const [auctionRes, roomsRes] = await Promise.all([
    supabase.from("auctions").select().eq("id", participant.auction_id).single(),
    supabase
      .from("rooms")
      .select()
      .eq("auction_id", participant.auction_id)
      .order("sort_order"),
  ]);

  return NextResponse.json({
    participant,
    auction: auctionRes.data,
    rooms: roomsRes.data || [],
  });
}
