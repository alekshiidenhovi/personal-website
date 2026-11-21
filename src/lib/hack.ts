/**
 * @fileoverview A tiny two-pass assembler for the HACK platform (nand2tetris), for the subset of instructions the
 * HACK assembler project's cover uses.
 */

/** An assembled instruction. */
export interface Instruction {
  readonly address: number;
  readonly source: string;
  /** The 16-bit machine code, as binary digits. */
  readonly binary: string;
}

/** The computation bits of each supported computation. */
const COMPUTATION_BITS: Readonly<Record<string, string>> = {
  '0': '0101010',
  '1': '0111111',
  D: '0001100',
  A: '0110000',
  M: '1110000',
  'D-1': '0001110',
  'D-A': '0010011',
  'M-1': '1110010',
  'M+1': '1110111',
  'D+M': '1000010',
};

/** The jump bits of each jump condition; an instruction without one never jumps. */
const JUMP_BITS: Readonly<Record<string, string>> = {
  '': '000',
  JGT: '001',
  JEQ: '010',
  JGE: '011',
  JLT: '100',
  JNE: '101',
  JLE: '110',
  JMP: '111',
};

/** Where the platform starts placing variables in memory. */
const FIRST_VARIABLE_ADDRESS = 16;

/**
 * Checks whether a line declares a label, such as `(LOOP)`, rather than being an instruction.
 *
 * @param line The source line.
 * @returns Whether the line is a label.
 */
function isLabel(line: string): boolean {
  return line.startsWith('(');
}

/**
 * Encodes a computation instruction, such as `D=D-A` or `0;JMP`.
 *
 * @param source The instruction.
 * @returns The machine code.
 */
function encodeComputation(source: string): string {
  const [assignment, jump = ''] = source.split(';');
  const [destination, computation] = assignment.includes('=') ? assignment.split('=') : ['', assignment];
  const computationBits = COMPUTATION_BITS[computation];
  const jumpBits = JUMP_BITS[jump];
  if (computationBits === undefined || jumpBits === undefined) {
    throw new Error(`Unsupported HACK instruction: ${source}`);
  }
  const destinationBits = ['A', 'D', 'M'].map((register) => (destination.includes(register) ? '1' : '0')).join('');
  return `111${computationBits}${destinationBits}${jumpBits}`;
}

/**
 * Finds the address each label points to: the instruction that follows it.
 *
 * @param lines The program's lines.
 * @returns The addresses by label.
 */
function resolveLabels(lines: readonly string[]): Map<string, number> {
  const labels = new Map<string, number>();
  let address = 0;
  for (const line of lines) {
    if (isLabel(line)) {
      labels.set(line.slice(1, -1), address);
    } else {
      address++;
    }
  }
  return labels;
}

/**
 * Assembles a program in two passes: labels first, then variables and instructions.
 *
 * @param lines The program's lines, each a label or an instruction.
 * @returns The instructions with their addresses and machine code.
 */
export function assemble(lines: readonly string[]): Instruction[] {
  const symbols = resolveLabels(lines);
  let nextVariableAddress = FIRST_VARIABLE_ADDRESS;

  /**
   * Resolves an address instruction's value: a number, a label, or a variable, which gets the next free address.
   *
   * @param symbol The value after the `@`.
   * @returns The address.
   */
  function resolveAddress(symbol: string): number {
    if (/^\d+$/.test(symbol)) {
      return Number(symbol);
    }
    const known = symbols.get(symbol);
    if (known !== undefined) {
      return known;
    }
    symbols.set(symbol, nextVariableAddress);
    return nextVariableAddress++;
  }

  return lines
    .filter((line) => !isLabel(line))
    .map((source, address) => ({
      address,
      source,
      binary: source.startsWith('@')
        ? `0${resolveAddress(source.slice(1)).toString(2).padStart(15, '0')}`
        : encodeComputation(source),
    }));
}
