import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { ROOM_DEFINITIONS } from "@/lib/rooms";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { rentTotal, participants: participantList } = body as {
    rentTotal: number;
    participants: { name: string; email: string }[];
  };

  // Validate rent total
  if (!rentTotal || typeof rentTotal !== "number" || rentTotal <= 0 || rentTotal > 100000) {
    return NextResponse.json({ error: "Rent must be between $1 and $100,000" }, { status: 400 });
  }

  // Validate participants
  if (!participantList || !Array.isArray(participantList) || participantList.length !== 3) {
    return NextResponse.json({ error: "Exactly 3 participants required" }, { status: 400 });
  }

  for (const p of participantList) {
    if (!p.name || typeof p.name !== "string" || p.name.trim().length === 0 || p.name.trim().length > 100) {
      return NextResponse.json({ error: "Invalid participant name" }, { status: 400 });
    }
    if (!p.email || typeof p.email !== "string" || !/\S+@\S+\.\S+/.test(p.email.trim())) {
      return NextResponse.json({ error: "Invalid participant email" }, { status: 400 });
    }
  }

  // Create auction
  const { data: auction, error: auctionError } = await supabase
    .from("auctions")
    .insert({ rent_total: Math.round(rentTotal * 100) / 100 })
    .select()
    .single();

  if (auctionError || !auction) {
    return NextResponse.json({ error: "Failed to create auction" }, { status: 500 });
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
    return NextResponse.json({ error: "Failed to create rooms" }, { status: 500 });
  }

  // Create participants with cryptographically secure tokens
  const participantInserts = participantList.map((p) => ({
    auction_id: auction.id,
    name: p.name.trim().slice(0, 100),
    email: p.email.trim().toLowerCase().slice(0, 254),
    access_token: randomBytes(32).toString("hex"),
  }));

  const { data: participants, error: participantError } = await supabase
    .from("participants")
    .insert(participantInserts)
    .select();

  if (participantError || !participants) {
    return NextResponse.json({ error: "Failed to create participants" }, { status: 500 });
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
