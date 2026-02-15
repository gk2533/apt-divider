import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { ROOM_DEFINITIONS } from "@/lib/rooms";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { rentTotal, participants: participantList } = body as {
    rentTotal: number;
    participants: { name: string; email: string }[];
  };

  if (!rentTotal || rentTotal <= 0) {
    return NextResponse.json({ error: "Invalid rent total" }, { status: 400 });
  }
  if (!participantList || participantList.length !== 3) {
    return NextResponse.json({ error: "Exactly 3 participants required" }, { status: 400 });
  }

  // Create auction
  const { data: auction, error: auctionError } = await supabase
    .from("auctions")
    .insert({ rent_total: rentTotal })
    .select()
    .single();

  if (auctionError || !auction) {
    return NextResponse.json({ error: auctionError?.message || "Failed to create auction" }, { status: 500 });
  }

  // Create rooms
  const roomInserts = ROOM_DEFINITIONS.map((room, i) => ({
    auction_id: auction.id,
    key: room.key,
    name: room.name,
    description: room.description,
    sort_order: i,
  }));

  const { error: roomError } = await supabase.from("rooms").insert(roomInserts);
  if (roomError) {
    return NextResponse.json({ error: roomError.message }, { status: 500 });
  }

  // Create participants
  const participantInserts = participantList.map((p) => ({
    auction_id: auction.id,
    name: p.name,
    email: p.email,
  }));

  const { data: participants, error: participantError } = await supabase
    .from("participants")
    .insert(participantInserts)
    .select();

  if (participantError || !participants) {
    return NextResponse.json({ error: participantError?.message || "Failed to create participants" }, { status: 500 });
  }

  return NextResponse.json({
    auctionId: auction.id,
    participants: participants.map((p) => ({
      name: p.name,
      email: p.email,
      token: p.access_token,
    })),
  });
}
