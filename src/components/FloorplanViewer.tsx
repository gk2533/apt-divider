"use client";

import { ROOM_DEFINITIONS, RoomDefinition } from "@/lib/rooms";
import Image from "next/image";

interface FloorplanViewerProps {
  highlightRoom?: string;
  onRoomClick?: (room: RoomDefinition) => void;
  roomPrices?: Record<string, number>;
  assignedRooms?: Record<string, string>;
  compact?: boolean;
}

export default function FloorplanViewer({
  highlightRoom,
  onRoomClick,
  roomPrices,
  assignedRooms,
  compact,
}: FloorplanViewerProps) {
  return (
    <div className="relative w-full mx-auto">
      <div className="relative rounded-2xl overflow-hidden border border-zinc-200 bg-white shadow-sm">
        <Image
          src="/floorplan.png"
          alt="Apartment floorplan — The Westline, Unit 02"
          width={1200}
          height={900}
          className="w-full h-auto"
          priority
        />
        {/* Room overlay markers */}
        {ROOM_DEFINITIONS.map((room) => {
          const isHighlighted = highlightRoom === room.key;
          const price = roomPrices?.[room.key];
          const assignee = assignedRooms?.[room.key];
          const hasResults = price !== undefined;

          return (
            <button
              key={room.key}
              onClick={() => onRoomClick?.(room)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2
                flex flex-col items-center gap-0.5
                ${onRoomClick ? "cursor-pointer" : "cursor-default"}
              `}
              style={{
                top: room.overlayPosition.top,
                left: room.overlayPosition.left,
              }}
            >
              {/* Badge circle with letter */}
              <div
                className={`
                  flex items-center justify-center rounded-full font-bold text-white shadow-lg
                  ${compact ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm"}
                  ${isHighlighted ? "ring-3 ring-white scale-110" : ""}
                `}
                style={{ backgroundColor: room.color }}
              >
                {room.label}
              </div>

              {/* Info card below the badge */}
              {!compact && (
                <div
                  className={`
                    mt-1 rounded-lg px-2.5 py-1.5 text-center shadow-md backdrop-blur-sm
                    border-2 whitespace-nowrap
                    ${isHighlighted ? "scale-105" : ""}
                  `}
                  style={{
                    backgroundColor: hasResults ? room.color : "rgba(255,255,255,0.95)",
                    borderColor: room.color,
                    color: hasResults ? "white" : room.color,
                  }}
                >
                  <div className="text-[11px] font-semibold leading-tight">
                    {room.name}
                  </div>
                  <div
                    className="text-[10px] leading-tight"
                    style={{ opacity: hasResults ? 0.9 : 0.7 }}
                  >
                    {room.sqFt}
                  </div>
                  {room.hasEnsuite && (
                    <div
                      className="text-[9px] font-medium leading-tight"
                      style={{ opacity: hasResults ? 0.9 : 0.7 }}
                    >
                      Private Bath
                    </div>
                  )}
                  {price !== undefined && (
                    <div className="text-xs font-bold mt-0.5 font-mono">
                      ${price.toLocaleString()}/mo
                    </div>
                  )}
                  {assignee && (
                    <div className="text-[11px] font-semibold mt-0.5">
                      {assignee}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Room legend below floorplan */}
      {!compact && !roomPrices && (
        <div className="flex items-center justify-center gap-6 mt-4">
          {ROOM_DEFINITIONS.map((room) => (
            <div key={room.key} className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ backgroundColor: room.color }}
              >
                {room.label}
              </div>
              <div>
                <span className="text-sm font-medium text-zinc-700">{room.name}</span>
                <span className="text-xs text-zinc-400 ml-1.5">{room.sqFt}</span>
                {room.hasEnsuite && (
                  <span className="text-xs text-zinc-400 ml-1">+ bath</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
