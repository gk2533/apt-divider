export interface RoomDefinition {
  key: string;
  name: string;
  label: string;
  description: string;
  sqFt: string;
  hasEnsuite: boolean;
  color: string;
  bgColor: string;
  borderColor: string;
  // Position on floorplan as percentage (for overlay labels)
  // Calibrated to floorplan.png — The Westline Unit 02
  overlayPosition: { top: string; left: string };
}

export const ROOM_DEFINITIONS: RoomDefinition[] = [
  {
    key: "bedroom_1",
    name: "Bedroom 1",
    label: "A",
    description: "Bottom-left room, shares hall bathroom",
    sqFt: "12'6\" × 9'7\"",
    hasEnsuite: false,
    color: "#2563EB",
    bgColor: "rgba(37, 99, 235, 0.12)",
    borderColor: "#2563EB",
    // Bottom-left bedroom in the floorplan area
    overlayPosition: { top: "71%", left: "38%" },
  },
  {
    key: "bedroom_2",
    name: "Bedroom 2",
    label: "B",
    description: "Bottom-center room, smallest, shares hall bathroom",
    sqFt: "9'7\" × 8'6\"",
    hasEnsuite: false,
    color: "#059669",
    bgColor: "rgba(5, 150, 105, 0.12)",
    borderColor: "#059669",
    // Bottom-center bedroom in the floorplan area
    overlayPosition: { top: "71%", left: "54%" },
  },
  {
    key: "bedroom_3",
    name: "Bedroom 3",
    label: "C",
    description: "Right side, largest room with private bathroom",
    sqFt: "17'8\" × 11'1\"",
    hasEnsuite: true,
    color: "#D97706",
    bgColor: "rgba(217, 119, 6, 0.12)",
    borderColor: "#D97706",
    // Right-side bedroom in the floorplan area
    overlayPosition: { top: "40%", left: "82%" },
  },
];
