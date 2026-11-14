/**
 * A tiny assembler for the HACK platform (nand2tetris), supporting the subset
 * of instructions used by the HACK assembler project's cover.
 */

export interface Instruction {
  address: number;
  source: string;
  /** The 16-bit machine code */
  binary: string;
}

const COMP: Record<string, string> = {
  "0": "0101010",
  "1": "0111111",
  D: "0001100",
  A: "0110000",
  M: "1110000",
  "D-1": "0001110",
  "D-A": "0010011",
  "M-1": "1110010",
  "M+1": "1110111",
  "D+M": "1000010",
};

const JUMP: Record<string, string> = {
  "": "000",
  JGT: "001",
  JEQ: "010",
  JGE: "011",
  JLT: "100",
  JNE: "101",
  JLE: "110",
  JMP: "111",
};

const FIRST_VARIABLE_ADDRESS = 16;

const isLabel = (line: string) => line.startsWith("(");

const encodeCInstruction = (source: string) => {
  const [assignment, jump = ""] = source.split(";");
  const [dest, comp] = assignment.includes("=") ? assignment.split("=") : ["", assignment];
  const destBits = ["A", "D", "M"].map((register) => (dest.includes(register) ? "1" : "0")).join("");
  return `111${COMP[comp]}${destBits}${JUMP[jump]}`;
};

/** Two-pass assembly: resolve labels first, then variables and instructions. */
export function assemble(lines: string[]): Instruction[] {
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

  return lines
    .filter((line) => !isLabel(line))
    .map((source, index) => ({
      address: index,
      source,
      binary: source.startsWith("@")
        ? `0${resolve(source.slice(1)).toString(2).padStart(15, "0")}`
        : encodeCInstruction(source),
    }));
}
