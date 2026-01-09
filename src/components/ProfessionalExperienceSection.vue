<script setup lang="ts">
import JobCard from "./JobCard.vue";
import SectionTitle from "./SectionTitle.vue";
</script>

<template>
  <section id="professional-experience">
    <SectionTitle title="Professional Experience" />
    <div class="job-container">
      <JobCard :jobTitle="'Machine Learning Engineer'" :startYear=2023 :startMonth=10 :endYear=2024 :endMonth=8
        :jobDescription="'Pioneered an end-to-end ticket analysis platform, from high-volume ETL pipelines to a neural-net topic modeling and interactive dashboard application. This automated system replaced labor-intensive manual audits, delivering superior insights in minutes rather than hours.'"
        :logoName="'supercell'" :tags="[
          'React', 'TypeScript', 'Python', 'FastAPI', 'SQL'
        ]" :companyUrl="'https://www.supercell.com/'" />
      <JobCard :jobTitle="'Data Analyst Intern'" :startYear=2023 :startMonth=1 :endYear=2023 :endMonth=8
        :jobDescription="'Led multiple data projects, ranging from BI dashboard development, to designing a Markovian Growth model for quantifying user engagement. Prototyped AI-based customer support tools, such as semantic ticket search and AI chatbots.'"
        :logoName="'supercell'" :tags="[
          'Python', 'SQL', 'Vector DBs'
        ]" :companyUrl="'https://www.supercell.com/'" />
      <JobCard :jobTitle="'Software Developer Intern'" :startYear=2022 :startMonth=6 :endYear=2022 :endMonth=8
        :jobDescription="'Prototyped an LLM-powered customer support ticket classification tool. Worked on a data-driven insights engine that provided customers frequent health facts and tips.'"
        :logoName="'veri'" :tags="[
          'Python', 'SQL', 'GPT-3'
        ]" :companyUrl="'https://www.veri.co/'" />
    </div>
  </section>
</template>

<style scoped>
#professional-experience {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(2rem, 5vw, 6rem);
  padding: clamp(2rem, 5vw, 5rem);
  width: 100%;
  max-width: 72rem;
  background-color: var(--neutral-950);
}

.job-container {
  display: flex;
  flex-direction: column;
  gap: clamp(1.5rem, 5vw, 3rem);
  width: 100%;
}
</style>
