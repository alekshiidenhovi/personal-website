import { createApp } from "vue";

import App from "./App.vue";
import { vReveal } from "./directives/reveal";
import "./style.css";

const app = createApp(App);
app.directive("reveal", vReveal);
app.mount("#app");

// Warns in the console when a slide's content doesn't fit; left out of production builds
if (import.meta.env.DEV) import("./lib/fitCheck").then(({ watchPageFit }) => watchPageFit());
