"use client";

import { Participant } from "@/lib/types";

interface StatusBoardProps {
  participants: Participant[];
}

export default function StatusBoard({ participants }: StatusBoardProps) {
  const submitted = participants.filter((p) => p.has_submitted).length;
  const total = participants.length;
  const allDone = submitted === total;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
        <h3 className="font-semibold text-zinc-900">Bid Status</h3>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full border border-white ${
                  i < submitted ? "bg-emerald-500" : "bg-zinc-200"
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-mono text-zinc-500">
            {submitted}/{total}
          </span>
        </div>
      </div>
      <div className="divide-y divide-zinc-50">
        {participants.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
            <div>
              <div className="font-medium text-zinc-900">{p.name}</div>
              <div className="text-xs text-zinc-400">{p.email}</div>
            </div>
            {p.has_submitted ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 text-sm font-medium bg-emerald-50 px-2.5 py-1 rounded-full">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Done
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-600 text-sm font-medium bg-amber-50 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Pending
              </span>
            )}
          </div>
        ))}
      </div>
      {allDone && (
        <div className="px-5 py-3 bg-emerald-50 border-t border-emerald-100">
          <p className="text-sm text-emerald-700 font-medium text-center">
            All bids are in — ready to calculate.
          </p>
        </div>
      )}
    </div>
  );
}
