/**
 * A tiny assembler and CPU for the HACK platform (nand2tetris), supporting the
 * subset of instructions used by the expertise card's demo program.
 */

interface Registers {
  a: number;
  d: number;
  m: number;
}

export interface CpuState {
  pc: number;
  a: number;
  d: number;
  ram: Record<number, number>;
}

export interface BitSegment {
  bits: string;
  label: string;
}

export interface Instruction {
  address: number;
  source: string;
  segments: BitSegment[];
  execute: (state: CpuState) => CpuState;
}

export interface ListingRow {
  source: string;
  address: number | null;
}

const COMP: Record<string, { bits: string; compute: (r: Registers) => number }> = {
  "0": { bits: "0101010", compute: () => 0 },
  "1": { bits: "0111111", compute: () => 1 },
  D: { bits: "0001100", compute: (r) => r.d },
  A: { bits: "0110000", compute: (r) => r.a },
  M: { bits: "1110000", compute: (r) => r.m },
  "D-1": { bits: "0001110", compute: (r) => r.d - 1 },
  "D-A": { bits: "0010011", compute: (r) => r.d - r.a },
  "M-1": { bits: "1110010", compute: (r) => r.m - 1 },
  "M+1": { bits: "1110111", compute: (r) => r.m + 1 },
  "D+M": { bits: "1000010", compute: (r) => r.d + r.m },
};

const JUMP: Record<string, { bits: string; test: (value: number) => boolean }> = {
  "": { bits: "000", test: () => false },
  JGT: { bits: "001", test: (v) => v > 0 },
  JEQ: { bits: "010", test: (v) => v === 0 },
  JGE: { bits: "011", test: (v) => v >= 0 },
  JLT: { bits: "100", test: (v) => v < 0 },
  JNE: { bits: "101", test: (v) => v !== 0 },
  JLE: { bits: "110", test: (v) => v <= 0 },
  JMP: { bits: "111", test: () => true },
};

const FIRST_VARIABLE_ADDRESS = 16;

const isLabel = (line: string) => line.startsWith("(");

const assembleAInstruction = (value: number, address: number, source: string): Instruction => ({
  address,
  source,
  segments: [
    { bits: "0", label: "op" },
    { bits: value.toString(2).padStart(15, "0"), label: "value" },
  ],
  execute: (state) => ({ ...state, a: value, pc: state.pc + 1 }),
});

const assembleCInstruction = (address: number, source: string): Instruction => {
  const [assignment, jumpName = ""] = source.split(";");
  const [dest, compName] = assignment.includes("=") ? assignment.split("=") : ["", assignment];
  const comp = COMP[compName];
  const jump = JUMP[jumpName];
  const destBits = ["A", "D", "M"].map((register) => (dest.includes(register) ? "1" : "0")).join("");

  return {
    address,
    source,
    segments: [
      { bits: "111", label: "op" },
      { bits: comp.bits[0], label: "a" },
      { bits: comp.bits.slice(1), label: "comp" },
      { bits: destBits, label: "dest" },
      { bits: jump.bits, label: "jump" },
    ],
    execute: (state) => {
      const value = comp.compute({ a: state.a, d: state.d, m: state.ram[state.a] ?? 0 });
      const ram = dest.includes("M") ? { ...state.ram, [state.a]: value } : state.ram;
      return {
        pc: jump.test(value) ? state.a : state.pc + 1,
        a: dest.includes("A") ? value : state.a,
        d: dest.includes("D") ? value : state.d,
        ram,
      };
    },
  };
};

/** Two-pass assembly: resolve labels first, then variables and instructions. */
export function assemble(lines: string[]) {
  const symbols: Record<string, number> = {};
  let address = 0;
  for (const line of lines) {
    if (isLabel(line)) symbols[line.slice(1, -1)] = address;
    else address++;
  }

  let nextVariable = FIRST_VARIABLE_ADDRESS;
  const resolve = (symbol: string) => {
    if (/^\d+$/.test(symbol)) return Number(symbol);
    symbols[symbol] ??= nextVariable++;
    return symbols[symbol];
  };

  const instructions: Instruction[] = [];
  const listing: ListingRow[] = lines.map((line) => {
    if (isLabel(line)) return { source: line, address: null };
    const instructionAddress = instructions.length;
    instructions.push(
      line.startsWith("@")
        ? assembleAInstruction(resolve(line.slice(1)), instructionAddress, line)
        : assembleCInstruction(instructionAddress, line),
    );
    return { source: line, address: instructionAddress };
  });

  return { instructions, listing, symbols };
}
