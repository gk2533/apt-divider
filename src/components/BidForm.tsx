"use client";

import { useState } from "react";
import { ROOM_DEFINITIONS } from "@/lib/rooms";
import { Room } from "@/lib/types";

interface BidFormProps {
  rooms: Room[];
  rentTotal: number;
  onSubmit: (bids: { roomId: string; value: number }[]) => Promise<void>;
  disabled?: boolean;
}

export default function BidForm({ rooms, rentTotal, onSubmit, disabled }: BidFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const avgRent = Math.round(rentTotal / 3);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const bids = rooms.map((room) => ({
      roomId: room.id,
      value: parseFloat(values[room.id] || "0"),
    }));

    for (const bid of bids) {
      if (isNaN(bid.value) || bid.value < 0) {
        setError("All bids must be non-negative numbers.");
        return;
      }
    }

    if (bids.every((b) => b.value === 0)) {
      setError("You must bid on at least one room.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(bids);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit bids");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm text-zinc-600 leading-relaxed">
          <span className="font-semibold text-zinc-800">How bidding works:</span>{" "}
          Enter the <strong className="text-zinc-900">maximum</strong> you&apos;d pay per month for each room.
          The algorithm guarantees you&apos;ll never pay more than your bid — and likely less.
          Average rent per person is{" "}
          <span className="font-mono font-semibold text-zinc-900">${avgRent.toLocaleString()}</span>.
        </p>
      </div>

      <div className="space-y-4">
        {rooms.map((room) => {
          const def = ROOM_DEFINITIONS.find((d) => d.key === room.key);
          const value = values[room.id] || "";

          return (
            <div
              key={room.id}
              className="rounded-xl border-2 bg-white p-5 hover:shadow-md"
              style={{ borderColor: def?.borderColor || "#e4e4e7" }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: def?.color }}
                >
                  {def?.label}
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 text-lg leading-tight">
                    {room.name}
                  </h3>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {def?.sqFt}
                    {def?.hasEnsuite && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                        Private Bath
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-lg font-medium">$</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder={avgRent.toString()}
                  value={value}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [room.id]: e.target.value }))
                  }
                  disabled={disabled}
                  className="w-full rounded-lg border border-zinc-300 pl-8 pr-14 py-3 text-lg font-mono font-semibold text-zinc-900
                    placeholder:text-zinc-300 placeholder:font-normal
                    focus:outline-none focus:ring-2 focus:border-transparent
                    disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ ["--tw-ring-color" as string]: def?.color }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">/mo</span>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-3 text-sm font-medium">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={disabled || submitting}
        className="w-full py-3.5 px-6 bg-zinc-900 text-white font-semibold rounded-xl text-base
          hover:bg-zinc-800 active:bg-zinc-950
          disabled:opacity-40 disabled:cursor-not-allowed
          shadow-sm hover:shadow-md"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting...
          </span>
        ) : (
          "Lock In My Bids"
        )}
      </button>
    </form>
  );
}
