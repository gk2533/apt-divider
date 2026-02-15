import { solveRentDivision, SolverInput, SolverResult } from "./solver";

// ============================================================
// Test Helpers
// ============================================================

function verify(
  label: string,
  input: SolverInput,
  result: SolverResult
): { passed: boolean; errors: string[] } {
  const errors: string[] = [];
  const n = input.bids.length;

  // 1. Budget balance: prices must sum to rent total
  const priceSum = result.assignment.reduce((s, a) => s + a.price, 0);
  if (Math.abs(priceSum - input.rentTotal) > 0.02) {
    errors.push(
      `Budget balance FAILED: prices sum to $${priceSum.toFixed(2)}, expected $${input.rentTotal.toFixed(2)}`
    );
  }

  // 2. Valid assignment: each participant assigned exactly one room, each room to one participant
  const assignedRooms = result.assignment.map((a) => a.roomId);
  const assignedParticipants = result.assignment.map((a) => a.participantId);
  const uniqueRooms = new Set(assignedRooms);
  const uniqueParticipants = new Set(assignedParticipants);
  if (uniqueRooms.size !== n) {
    errors.push(`Assignment FAILED: ${uniqueRooms.size} unique rooms assigned, expected ${n}`);
  }
  if (uniqueParticipants.size !== n) {
    errors.push(`Assignment FAILED: ${uniqueParticipants.size} unique participants, expected ${n}`);
  }

  // 3. Non-negative prices
  for (const a of result.assignment) {
    if (a.price < -0.01) {
      errors.push(`Negative price: participant ${a.participantId} pays $${a.price.toFixed(2)}`);
    }
  }

  // 4. Envy-freeness: no one prefers another's room-price combo
  for (let i = 0; i < n; i++) {
    const myAssignment = result.assignment.find(
      (a) => a.participantId === input.participantIds[i]
    )!;
    const myRoomIdx = input.roomIds.indexOf(myAssignment.roomId);
    const myUtility = input.bids[i][myRoomIdx] - myAssignment.price;

    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const theirAssignment = result.assignment.find(
        (a) => a.participantId === input.participantIds[j]
      )!;
      const theirRoomIdx = input.roomIds.indexOf(theirAssignment.roomId);
      const altUtility = input.bids[i][theirRoomIdx] - theirAssignment.price;

      if (altUtility > myUtility + 0.02) {
        errors.push(
          `Envy DETECTED: Person ${i} (utility $${myUtility.toFixed(2)}) envies Person ${j} ` +
          `(would get $${altUtility.toFixed(2)} with their room at their price)`
        );
      }
    }
  }

  // 5. Utility correctness: utility = valuation - price
  for (const a of result.assignment) {
    const pIdx = input.participantIds.indexOf(a.participantId);
    const rIdx = input.roomIds.indexOf(a.roomId);
    const expectedUtility = input.bids[pIdx][rIdx] - a.price;
    if (Math.abs(a.utility - expectedUtility) > 0.02) {
      errors.push(
        `Utility mismatch: Person ${pIdx} utility is ${a.utility}, expected ${expectedUtility.toFixed(2)}`
      );
    }
  }

  const passed = errors.length === 0;
  return { passed, errors };
}

function runTest(label: string, input: SolverInput) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TEST: ${label}`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Rent: $${input.rentTotal}`);
  console.log("Bids matrix:");
  for (let i = 0; i < input.bids.length; i++) {
    console.log(
      `  Person ${i}: [${input.bids[i].map((b) => `$${b}`).join(", ")}]`
    );
  }

  const result = solveRentDivision(input);

  console.log("\nResult:");
  for (const a of result.assignment) {
    const pIdx = input.participantIds.indexOf(a.participantId);
    const rIdx = input.roomIds.indexOf(a.roomId);
    console.log(
      `  Person ${pIdx} → Room ${rIdx} | Price: $${a.price.toFixed(2)} | Utility: $${a.utility.toFixed(2)}`
    );
  }
  console.log(`  Total: $${result.assignment.reduce((s, a) => s + a.price, 0).toFixed(2)}`);
  console.log(`  Min utility: $${result.minUtility.toFixed(2)}`);
  console.log(`  Envy-free: ${result.isEnvyFree}`);

  const { passed, errors } = verify(label, input, result);

  if (passed) {
    console.log(`  ✓ PASSED`);
  } else {
    console.log(`  ✗ FAILED:`);
    for (const e of errors) {
      console.log(`    - ${e}`);
    }
  }

  return passed;
}

// ============================================================
// Test Cases
// ============================================================

const pIds = ["p0", "p1", "p2"];
const rIds = ["r0", "r1", "r2"];

let totalTests = 0;
let passedTests = 0;

// ------ 1. Clear preferences (each person wants a different room) ------
totalTests++;
if (
  runTest("Clear distinct preferences", {
    rentTotal: 3000,
    bids: [
      [1500, 1000, 800], // Person 0 wants Room 0
      [900, 1400, 1000], // Person 1 wants Room 1
      [800, 900, 1300],  // Person 2 wants Room 2
    ],
    participantIds: pIds,
    roomIds: rIds,
  })
) passedTests++;

// ------ 2. Two people compete for the same room ------
totalTests++;
if (
  runTest("Two people want the same room (Room 0)", {
    rentTotal: 3000,
    bids: [
      [1800, 1000, 800], // Person 0 loves Room 0
      [1700, 1100, 900], // Person 1 also loves Room 0
      [900, 1000, 1200], // Person 2 prefers Room 2
    ],
    participantIds: pIds,
    roomIds: rIds,
  })
) passedTests++;

// ------ 3. All three want the same room ------
totalTests++;
if (
  runTest("All three want Room 0 (master bedroom)", {
    rentTotal: 3000,
    bids: [
      [2000, 1000, 800],
      [1800, 1100, 900],
      [1600, 1000, 1000],
    ],
    participantIds: pIds,
    roomIds: rIds,
  })
) passedTests++;

// ------ 4. Equal valuations (everyone bids identically) ------
totalTests++;
if (
  runTest("Identical bids from all three", {
    rentTotal: 3000,
    bids: [
      [1200, 1000, 800],
      [1200, 1000, 800],
      [1200, 1000, 800],
    ],
    participantIds: pIds,
    roomIds: rIds,
  })
) passedTests++;

// ------ 5. One person indifferent (same bid for all rooms) ------
totalTests++;
if (
  runTest("Person 2 is indifferent (bids same for all rooms)", {
    rentTotal: 3000,
    bids: [
      [1500, 1000, 800],
      [900, 1400, 1000],
      [1000, 1000, 1000],
    ],
    participantIds: pIds,
    roomIds: rIds,
  })
) passedTests++;

// ------ 6. Extreme disparity (master suite vs closet) ------
totalTests++;
if (
  runTest("Extreme disparity: luxury room vs tiny room", {
    rentTotal: 4500,
    bids: [
      [3000, 1500, 500],
      [2800, 1800, 600],
      [2500, 1600, 800],
    ],
    participantIds: pIds,
    roomIds: rIds,
  })
) passedTests++;

// ------ 7. Real-world scenario: The Westline at $8150 ------
totalTests++;
if (
  runTest("Westline $8150/mo: realistic bids", {
    rentTotal: 8150,
    bids: [
      [4000, 2500, 2200], // Wants the big room (C)
      [3800, 3000, 2000], // Flexible between A and B
      [3500, 2800, 2500], // Also wants big room but lower budget
    ],
    participantIds: pIds,
    roomIds: rIds,
  })
) passedTests++;

// ------ 8. Minimum viable bids (barely cover rent) ------
totalTests++;
if (
  runTest("Tight budget: bids barely cover rent", {
    rentTotal: 3000,
    bids: [
      [1100, 1000, 950],
      [1050, 1050, 950],
      [1000, 950, 1100],
    ],
    participantIds: pIds,
    roomIds: rIds,
  })
) passedTests++;

// ------ 9. High surplus bids (way over rent) ------
totalTests++;
if (
  runTest("High surplus: bids far exceed rent", {
    rentTotal: 3000,
    bids: [
      [5000, 3000, 2000],
      [4000, 4500, 2500],
      [3500, 3000, 4000],
    ],
    participantIds: pIds,
    roomIds: rIds,
  })
) passedTests++;

// ------ 10. Close competition: two rooms nearly identical ------
totalTests++;
if (
  runTest("Close competition: Rooms 0 and 1 valued nearly the same", {
    rentTotal: 3000,
    bids: [
      [1300, 1290, 800],
      [1310, 1300, 800],
      [900, 850, 1200],
    ],
    participantIds: pIds,
    roomIds: rIds,
  })
) passedTests++;

// ------ 11. One person dominates (much higher valuations) ------
totalTests++;
if (
  runTest("One rich bidder: Person 0 values everything higher", {
    rentTotal: 3000,
    bids: [
      [3000, 2500, 2000],
      [1200, 1100, 1000],
      [1100, 1200, 1000],
    ],
    participantIds: pIds,
    roomIds: rIds,
  })
) passedTests++;

// ------ 12. Reversed preference ordering ------
totalTests++;
if (
  runTest("Reversed preferences: each person's favorite is another's least", {
    rentTotal: 3000,
    bids: [
      [1500, 1000, 500],  // Person 0: R0 > R1 > R2
      [500, 1500, 1000],  // Person 1: R1 > R2 > R0
      [1000, 500, 1500],  // Person 2: R2 > R0 > R1
    ],
    participantIds: pIds,
    roomIds: rIds,
  })
) passedTests++;

// ------ 13. Westline scenario 2: different preference patterns ------
totalTests++;
if (
  runTest("Westline $8150: Person 1 wants smallest room (budget-conscious)", {
    rentTotal: 8150,
    bids: [
      [4200, 2800, 3000], // Wants big room
      [2000, 1800, 2200], // Budget-conscious, prefers smallest
      [3800, 3200, 2800], // Wants big room too
    ],
    participantIds: pIds,
    roomIds: rIds,
  })
) passedTests++;

// ------ 14. Near-zero differentiation ------
totalTests++;
if (
  runTest("Near-zero differentiation: everyone bids almost the same everywhere", {
    rentTotal: 3000,
    bids: [
      [1001, 1000, 999],
      [1000, 1001, 999],
      [999, 1000, 1001],
    ],
    participantIds: pIds,
    roomIds: rIds,
  })
) passedTests++;

// ------ 15. Stress test: very high rent ------
totalTests++;
if (
  runTest("High rent $15000: luxury apartment", {
    rentTotal: 15000,
    bids: [
      [8000, 5000, 4000],
      [7500, 6000, 3500],
      [6000, 5500, 5000],
    ],
    participantIds: pIds,
    roomIds: rIds,
  })
) passedTests++;

// ============================================================
// Summary
// ============================================================

console.log(`\n${"=".repeat(60)}`);
console.log(`SUMMARY: ${passedTests}/${totalTests} tests passed`);
if (passedTests === totalTests) {
  console.log("All tests PASSED ✓");
} else {
  console.log(`${totalTests - passedTests} test(s) FAILED ✗`);
}
console.log(`${"=".repeat(60)}\n`);

process.exit(passedTests === totalTests ? 0 : 1);
