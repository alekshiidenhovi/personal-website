import { createApp } from "vue";

import App from "./App.vue";
import { vReveal } from "./directives/reveal";
// Self-hosted fonts and bundled icons, so nothing waits on third-party servers
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./icons";
import "./style.css";

const app = createApp(App);
app.directive("reveal", vReveal);
app.mount("#app");
