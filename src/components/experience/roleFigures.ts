import type { Component } from 'vue';
import type { RoleFigureId } from '../../content/experience';
import LlmClassificationFigure from './figures/LlmClassificationFigure.vue';
import MarkovGrowthFigure from './figures/MarkovGrowthFigure.vue';
import SelfSupervisedEmbeddingsFigure from './figures/SelfSupervisedEmbeddingsFigure.vue';
import TopicModelingPipelineFigure from './figures/TopicModelingPipelineFigure.vue';

/** The component drawing each role's figure. Each takes an `active` prop, playing while it is true. */
export const ROLE_FIGURES: Readonly<Record<RoleFigureId, Component>> = {
  'self-supervised-embeddings': SelfSupervisedEmbeddingsFigure,
  'topic-modeling-pipeline': TopicModelingPipelineFigure,
  'markov-growth': MarkovGrowthFigure,
  'llm-classification': LlmClassificationFigure,
};
