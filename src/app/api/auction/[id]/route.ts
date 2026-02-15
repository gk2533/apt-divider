import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: auctionId } = await params;

  const [auctionRes, participantsRes, roomsRes] = await Promise.all([
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
  ]);

  if (auctionRes.error || !auctionRes.data) {
    return NextResponse.json({ error: "Auction not found" }, { status: 404 });
  }

  // Strip access_tokens — never send to client
  const participants = (participantsRes.data || []).map((p) => ({
    id: p.id,
    auction_id: p.auction_id,
    name: p.name,
    email: p.email,
    has_submitted: p.has_submitted,
  }));

  return NextResponse.json({
    auction: auctionRes.data,
    participants,
    rooms: roomsRes.data || [],
  });
}
