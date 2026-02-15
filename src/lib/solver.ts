// eslint-disable-next-line @typescript-eslint/no-require-imports
const solver = require("javascript-lp-solver");

export interface SolverInput {
  rentTotal: number;
  // bids[i][j] = participant i's max willingness to pay for room j
  bids: number[][];
  participantIds: string[];
  roomIds: string[];
}

export interface SolverResult {
  assignment: { participantId: string; roomId: string; price: number; utility: number }[];
  totalRent: number;
  minUtility: number;
  isEnvyFree: boolean;
}

/**
 * Brute-force all permutations for n=3 to find welfare-maximizing assignment.
 * Returns the permutation [room index for participant 0, room index for participant 1, ...]
 */
function findOptimalAssignment(bids: number[][]): number[] {
  const n = bids.length;
  const permutations = getPermutations(n);

  let bestPerm = permutations[0];
  let bestWelfare = -Infinity;

  for (const perm of permutations) {
    let welfare = 0;
    for (let i = 0; i < n; i++) {
      welfare += bids[i][perm[i]];
    }
    if (welfare > bestWelfare) {
      bestWelfare = welfare;
      bestPerm = perm;
    }
  }

  return bestPerm;
}

function getPermutations(n: number): number[][] {
  const result: number[][] = [];
  const arr = Array.from({ length: n }, (_, i) => i);

  function permute(start: number) {
    if (start === n) {
      result.push([...arr]);
      return;
    }
    for (let i = start; i < n; i++) {
      [arr[start], arr[i]] = [arr[i], arr[start]];
      permute(start + 1);
      [arr[start], arr[i]] = [arr[i], arr[start]];
    }
  }

  permute(0);
  return result;
}

/**
 * Solve for envy-free prices using LP with maximin objective.
 * Given an assignment, find prices p_j such that:
 *   1. sum(p_j) = rentTotal
 *   2. For all i, for all j: v_i(assigned_i) - p(assigned_i) >= v_i(j) - p(j)  [envy-free]
 *   3. Maximize the minimum utility across all agents [maximin]
 */
function solveEnvyFreePrices(
  bids: number[][],
  assignment: number[],
  rentTotal: number
): { prices: number[]; minUtility: number } | null {
  const n = bids.length;

  // javascript-lp-solver uses a model format
  // Variables: p0, p1, p2 (room prices), slack (min utility to maximize)
  // We need to reformulate for the solver's format.
  //
  // The solver maximizes an objective, so we maximize "slack".
  //
  // Constraints:
  //   p0 + p1 + p2 = rentTotal  (budget balance)
  //   For each agent i, for each room j != assigned[i]:
  //     v_i(assigned[i]) - p(assigned[i]) >= v_i(j) - p(j)
  //     => p(j) - p(assigned[i]) >= v_i(j) - v_i(assigned[i])
  //     Rewritten: p(j) - p(assigned[i]) >= v_i(j) - v_i(assigned[i])
  //   For each agent i:
  //     v_i(assigned[i]) - p(assigned[i]) >= slack
  //     => -p(assigned[i]) - slack >= -v_i(assigned[i])
  //     => p(assigned[i]) + slack <= v_i(assigned[i])

  // javascript-lp-solver uses a constraint format where each constraint
  // is { variable_coefficients..., constraint_name: value }
  // Let's build the model directly.

  const model: {
    optimize: string;
    opType: string;
    constraints: Record<string, { equal?: number; min?: number; max?: number }>;
    variables: Record<string, Record<string, number>>;
  } = {
    optimize: "utility",
    opType: "max",
    constraints: {} as Record<string, { equal?: number; min?: number; max?: number }>,
    variables: {} as Record<string, Record<string, number>>,
  };

  // Create price variables and slack variable
  for (let j = 0; j < n; j++) {
    model.variables[`p${j}`] = { budget: 1 };
  }
  model.variables["slack"] = { utility: 1 };

  // Budget balance: p0 + p1 + p2 = rentTotal
  model.constraints["budget"] = { equal: rentTotal };

  // Envy-free constraints:
  // For each agent i, for each room j != assignment[i]:
  //   v_i(assignment[i]) - p(assignment[i]) >= v_i(j) - p(j)
  //   => p(j) - p(assignment[i]) >= v_i(j) - v_i(assignment[i])
  let constraintIdx = 0;
  for (let i = 0; i < n; i++) {
    const ai = assignment[i]; // room assigned to agent i
    for (let j = 0; j < n; j++) {
      if (j === ai) continue;
      const cName = `ef_${constraintIdx++}`;
      // p(j) - p(ai) >= v_i(j) - v_i(ai)
      const rhs = bids[i][j] - bids[i][ai];
      model.constraints[cName] = { min: rhs };
      // Add coefficients to variables
      model.variables[`p${j}`][cName] = 1;
      model.variables[`p${ai}`][cName] =
        (model.variables[`p${ai}`][cName] || 0) - 1;
    }
  }

  // Maximin constraints:
  // For each agent i: v_i(ai) - p(ai) >= slack
  // => p(ai) + slack <= v_i(ai)
  for (let i = 0; i < n; i++) {
    const ai = assignment[i];
    const cName = `maximin_${i}`;
    model.constraints[cName] = { max: bids[i][ai] };
    model.variables[`p${ai}`][cName] =
      (model.variables[`p${ai}`][cName] || 0) + 1;
    model.variables["slack"][cName] = 1;
  }

  // Non-negative prices (allow slightly negative for extreme cases, floor at -100)
  for (let j = 0; j < n; j++) {
    const cName = `nonneg_${j}`;
    model.constraints[cName] = { min: 0 };
    model.variables[`p${j}`][cName] = 1;
  }

  const result = solver.Solve(model);

  if (!result.feasible) {
    return null;
  }

  const prices = [];
  for (let j = 0; j < n; j++) {
    prices.push(Math.round((result[`p${j}`] || 0) * 100) / 100);
  }

  // Adjust rounding error so prices sum exactly to rentTotal
  const sum = prices.reduce((a, b) => a + b, 0);
  const diff = rentTotal - sum;
  if (Math.abs(diff) > 0) {
    // Add rounding diff to the highest price room
    const maxIdx = prices.indexOf(Math.max(...prices));
    prices[maxIdx] = Math.round((prices[maxIdx] + diff) * 100) / 100;
  }

  return {
    prices,
    minUtility: Math.round((result["slack"] || 0) * 100) / 100,
  };
}

/**
 * Main solver: takes bids and rent, returns envy-free assignment + prices.
 */
export function solveRentDivision(input: SolverInput): SolverResult {
  const { rentTotal, bids, participantIds, roomIds } = input;
  const n = bids.length;

  // Step 1: Find welfare-maximizing assignment
  const assignment = findOptimalAssignment(bids);

  // Step 2: Compute envy-free prices
  const priceResult = solveEnvyFreePrices(bids, assignment, rentTotal);

  if (!priceResult) {
    // Fallback: if LP is infeasible, use proportional pricing
    // This can happen if combined valuations can't cover rent
    const totalVal = assignment.reduce((sum, ai, i) => sum + bids[i][ai], 0);
    const prices = assignment.map((ai, i) => {
      return Math.round((bids[i][ai] / totalVal) * rentTotal * 100) / 100;
    });
    // Fix rounding
    const sum = prices.reduce((a, b) => a + b, 0);
    prices[0] = Math.round((prices[0] + (rentTotal - sum)) * 100) / 100;

    return {
      assignment: assignment.map((roomIdx, i) => ({
        participantId: participantIds[i],
        roomId: roomIds[roomIdx],
        price: prices[i],
        utility: Math.round((bids[i][roomIdx] - prices[i]) * 100) / 100,
      })),
      totalRent: rentTotal,
      minUtility: Math.min(...assignment.map((ai, i) => bids[i][ai] - prices[i])),
      isEnvyFree: false,
    };
  }

  // Verify envy-freeness
  let isEnvyFree = true;
  for (let i = 0; i < n; i++) {
    const ai = assignment[i];
    const myUtility = bids[i][ai] - priceResult.prices[ai];
    for (let j = 0; j < n; j++) {
      if (j === ai) continue;
      const altUtility = bids[i][j] - priceResult.prices[j];
      if (altUtility > myUtility + 0.01) {
        isEnvyFree = false;
      }
    }
  }

  return {
    assignment: assignment.map((roomIdx, i) => ({
      participantId: participantIds[i],
      roomId: roomIds[roomIdx],
      price: priceResult.prices[roomIdx],
      utility:
        Math.round((bids[i][roomIdx] - priceResult.prices[roomIdx]) * 100) / 100,
    })),
    totalRent: rentTotal,
    minUtility: priceResult.minUtility,
    isEnvyFree,
  };
}
