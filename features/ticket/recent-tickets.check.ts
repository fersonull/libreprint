// Self-check for recent tickets. Run: bun run features/ticket/recent-tickets.check.ts
import { codeDigits } from "./recent-tickets";

console.assert(codeDigits("PQ-481920") === "481920", "pasted full code keeps its digits");
console.assert(codeDigits(" pq 4819 ") === "4819", "lowercase prefix and spaces are dropped");
console.assert(codeDigits("4819201234") === "481920", "at most six digits");
console.log("recent-tickets ok");
