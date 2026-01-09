<script setup lang="ts">
import ProjectCard from "./ProjectCard.vue";
import SectionTitle from "./SectionTitle.vue";
</script>

<template>
  <section id="projects">
    <SectionTitle title="Projects" />
    <div class="card-container">
      <ProjectCard :projectTitle="'C-- compiler'"
        :projectDescription="'C17 standard compiler, built from scratch in Rust'" :projectTag="'low level'"
        :completionYear=2025 :imgUrl="'/c-source-code-min.jpg'" :imgDescription="'C source code'"
        :projectLink="'https://github.com/alekshiidenhovi/C--'" :objectPosition="'top'" />
      <ProjectCard :projectTitle="'Portfolio website'" :projectDescription="'Source code for this website'"
        :projectTag="'web dev'" :completionYear=2025 :imgUrl="'/portfolio.png'"
        :imgDescription="'Portfolio hero section'"
        :projectLink="'https://github.com/alekshiidenhovi/personal-website'" />
      <ProjectCard :projectTitle="'HACK assembler'"
        :projectDescription="'Two-pass assembler for HACK computing platform'" :projectTag="'low level'"
        :completionYear=2025 :imgUrl="'/hack-assembly-source-code.jpg'" :imgDescription="'HACK assembly code'"
        :projectLink="'https://github.com/alekshiidenhovi/HACK-assembler'" :objectPosition="'top'" />
      <ProjectCard :projectTitle="'SISPA'" :projectDescription="'End-to-end machine unlearning framework'"
        :projectTag="'machine learning'" :completionYear=2025 :imgUrl="'/sispa-architecture-diagram.jpg'"
        :imgDescription="'SISPA architecture diagram'" :projectLink="'https://github.com/alekshiidenhovi/SISPA'"
        :objectPosition="'top'" />
      <ProjectCard :projectTitle="'BASIC interpreter'"
        :projectDescription="'Classic programming language, modern implementation'" :projectTag="'low level'"
        :completionYear=2025 :imgUrl="'/basic-source-code-min.jpg'" :imgDescription="'BASIC source code'"
        :projectLink="'https://github.com/alekshiidenhovi/BASIC-interpreter'" :objectPosition="'top'" />
      <ProjectCard :projectTitle="'ColViT'" :projectDescription="'Fast and scalable face identification'"
        :projectTag="'machine learning'" :completionYear=2025 :imgUrl="'/colvit-architecture-diagram.jpg'"
        :imgDescription="'ColViT architecture diagram'" :projectLink="'https://github.com/alekshiidenhovi/colvit-face'"
        :objectPosition="'top'" />
    </div>
  </section>
</template>

<style scoped>
#projects {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(2rem, 5vw, 6rem);
  padding: clamp(1.5rem, 5vw, 5rem);
  width: 100%;
  max-width: 104rem;
  background-color: var(--neutral-950);
}

.card-container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: clamp(1.5rem, 5vw, 3rem);
  width: 100%;
}
</style>
