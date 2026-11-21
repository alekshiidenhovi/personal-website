import type { Component } from 'vue';
import type { ExpertiseVisualId } from '../../content/expertise';
import DataPipelineVisual from './visuals/DataPipelineVisual.vue';
import PretrainingRunVisual from './visuals/PretrainingRunVisual.vue';
import TicketDashboardVisual from './visuals/TicketDashboardVisual.vue';

/** The component of each expertise visual. Each takes an `active` prop, playing while it is true. */
export const EXPERTISE_VISUALS: Readonly<Record<ExpertiseVisualId, Component>> = {
  'pretraining-run': PretrainingRunVisual,
  'data-pipeline': DataPipelineVisual,
  'ticket-dashboard': TicketDashboardVisual,
};
