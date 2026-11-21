import type { Component } from 'vue';
import type { ProjectCoverId } from '../../content/projects';
import AssemblerCover from './covers/AssemblerCover.vue';
import BasicCover from './covers/BasicCover.vue';
import ColvitCover from './covers/ColvitCover.vue';
import CompilerCover from './covers/CompilerCover.vue';
import PortfolioCover from './covers/PortfolioCover.vue';
import SispaCover from './covers/SispaCover.vue';

/** The component of each project cover. Each takes an `active` prop, playing while it is true. */
export const PROJECT_COVERS: Readonly<Record<ProjectCoverId, Component>> = {
  basic: BasicCover,
  colvit: ColvitCover,
  portfolio: PortfolioCover,
  sispa: SispaCover,
  compiler: CompilerCover,
  assembler: AssemblerCover,
};
