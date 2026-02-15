export interface Auction {
  id: string;
  rent_total: number;
  status: "bidding" | "completed";
  created_at: string;
}

export interface Room {
  id: string;
  auction_id: string;
  key: string;
  name: string;
  description: string;
  sort_order: number;
}

export interface Participant {
  id: string;
  auction_id: string;
  name: string;
  email: string;
  access_token: string;
  has_submitted: boolean;
}

export interface Bid {
  id: string;
  participant_id: string;
  room_id: string;
  value: number;
}

export interface Result {
  id: string;
  auction_id: string;
  participant_id: string;
  assigned_room_id: string;
  price: number;
  utility: number;
}
