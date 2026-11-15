import { createApp } from "vue";

import App from "./App.vue";
import { vReveal } from "./directives/reveal";
// Bundled icons, so nothing waits on the Iconify API
import "./icons";
import "./style.css";

const app = createApp(App);
app.directive("reveal", vReveal);
app.mount("#app");
