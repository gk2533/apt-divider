"use client";

import { useState } from "react";
import { ROOM_DEFINITIONS } from "@/lib/rooms";
import { Participant, Room, Result } from "@/lib/types";

interface ResultsViewProps {
  results: Result[];
  participants: Participant[];
  rooms: Room[];
  rentTotal: number;
  bidsMatrix?: number[][];
}

export default function ResultsView({
  results,
  participants,
  rooms,
  rentTotal,
  bidsMatrix,
}: ResultsViewProps) {
  const [swapFrom, setSwapFrom] = useState<string | null>(null);
  const [swapTo, setSwapTo] = useState<string | null>(null);

  const getParticipant = (id: string) => participants.find((p) => p.id === id);
  const getRoom = (id: string) => rooms.find((r) => r.id === id);
  const getRoomDef = (key: string) => ROOM_DEFINITIONS.find((d) => d.key === key);

  const priceSum = results.reduce((s, r) => s + Number(r.price), 0);

  const getSwapAnalysis = () => {
    if (!swapFrom || !swapTo || !bidsMatrix) return null;

    const fromResult = results.find((r) => r.participant_id === swapFrom);
    const toResult = results.find((r) => r.participant_id === swapTo);
    if (!fromResult || !toResult) return null;

    const fromIdx = participants.findIndex((p) => p.id === swapFrom);
    const toIdx = participants.findIndex((p) => p.id === swapTo);
    const toRoomIdx = rooms.findIndex((r) => r.id === toResult.assigned_room_id);
    const fromRoomIdx = rooms.findIndex((r) => r.id === fromResult.assigned_room_id);

    const fromSwapUtility = bidsMatrix[fromIdx][toRoomIdx] - Number(toResult.price);
    const fromCurrentUtility = Number(fromResult.utility);
    const toSwapUtility = bidsMatrix[toIdx][fromRoomIdx] - Number(fromResult.price);
    const toCurrentUtility = Number(toResult.utility);

    return {
      from: {
        name: getParticipant(swapFrom)?.name || "",
        currentRoom: getRoom(fromResult.assigned_room_id)?.name || "",
        currentUtility: fromCurrentUtility,
        swapRoom: getRoom(toResult.assigned_room_id)?.name || "",
        swapUtility: fromSwapUtility,
        wouldSwap: fromSwapUtility > fromCurrentUtility,
      },
      to: {
        name: getParticipant(swapTo)?.name || "",
        currentRoom: getRoom(toResult.assigned_room_id)?.name || "",
        currentUtility: toCurrentUtility,
        swapRoom: getRoom(fromResult.assigned_room_id)?.name || "",
        swapUtility: toSwapUtility,
        wouldSwap: toSwapUtility > toCurrentUtility,
      },
    };
  };

  const swapAnalysis = getSwapAnalysis();

  return (
    <div className="space-y-6">
      {/* Assignment cards */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h3 className="font-semibold text-zinc-900">Room Assignments</h3>
        </div>
        <div className="divide-y divide-zinc-50">
          {results.map((result) => {
            const participant = getParticipant(result.participant_id);
            const room = getRoom(result.assigned_room_id);
            const roomDef = room ? getRoomDef(room.key) : null;

            return (
              <div key={result.id} className="flex items-center px-5 py-4 gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: roomDef?.color }}
                >
                  {roomDef?.label}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-zinc-900">
                    {participant?.name}
                  </div>
                  <div className="text-sm text-zinc-500">{room?.name} — {roomDef?.sqFt}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono font-bold text-lg text-zinc-900">
                    ${Number(result.price).toLocaleString()}
                  </div>
                  <div className="text-xs text-zinc-400 font-mono">
                    surplus ${Number(result.utility).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-5 py-3.5 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center">
          <span className="font-semibold text-zinc-500 text-sm">Monthly Total</span>
          <span className="font-mono font-bold text-zinc-900 text-lg">
            ${priceSum.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Envy-free verification */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-emerald-900">Envy-Free Allocation</h4>
            <p className="text-sm text-emerald-700 mt-0.5">
              No roommate would prefer to swap their room and price with anyone else.
              This is the mathematically fairest possible division.
            </p>
          </div>
        </div>
      </div>

      {/* Swap calculator */}
      {bidsMatrix && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="font-semibold text-zinc-900 mb-1">Swap Calculator</h3>
          <p className="text-sm text-zinc-500 mb-4">
            Verify fairness — see what happens if two roommates swapped rooms at current prices.
          </p>
          <div className="flex items-center gap-3 mb-4">
            <select
              value={swapFrom || ""}
              onChange={(e) => { setSwapFrom(e.target.value || null); setSwapTo(null); }}
              className="flex-1 border border-zinc-300 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-900
                focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent bg-white"
            >
              <option value="">Select person...</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <svg className="w-5 h-5 text-zinc-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <select
              value={swapTo || ""}
              onChange={(e) => setSwapTo(e.target.value || null)}
              className="flex-1 border border-zinc-300 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-900
                focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent bg-white"
            >
              <option value="">Select person...</option>
              {participants
                .filter((p) => p.id !== swapFrom)
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>
          </div>

          {swapAnalysis && (
            <div className="space-y-2">
              {[swapAnalysis.from, swapAnalysis.to].map((person) => (
                <div
                  key={person.name}
                  className={`rounded-lg p-4 text-sm ${
                    person.wouldSwap
                      ? "bg-red-50 border border-red-200"
                      : "bg-emerald-50 border border-emerald-200"
                  }`}
                >
                  <span className="font-semibold text-zinc-900">{person.name}</span>
                  <span className="text-zinc-600">
                    {" "}is in <strong>{person.currentRoom}</strong> (surplus: ${person.currentUtility.toLocaleString()}).
                    Swapping to <strong>{person.swapRoom}</strong> would give surplus: ${person.swapUtility.toLocaleString()}.
                  </span>
                  <span className={`font-semibold ml-1 ${person.wouldSwap ? "text-red-700" : "text-emerald-700"}`}>
                    {person.wouldSwap ? "Would prefer to swap." : "Prefers their current room."}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
