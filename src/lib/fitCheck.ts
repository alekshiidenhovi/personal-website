/** How long the window must stop resizing before checking again, so layouts that follow the size have settled */
const SETTLE_MS = 500;

/**
 * Development aid: warns in the console whenever a slide's content doesn't
 * fit. Pages are designed to fit the screen; one that overflows scrolls on
 * its own, catching swipes meant for the page, and a box that clips its
 * overflow hides part of its content. Checks once the page has loaded, and
 * again after every resize, so any screen size can be tried in the browser.
 */
export function watchPageFit() {
  const check = () => {
    for (const section of document.querySelectorAll<HTMLElement>(".pinned-section")) {
      for (const [index, page] of section.querySelectorAll<HTMLElement>(".page").entries()) {
        const where = `${section.id} page ${index + 1}`;
        const overflow = page.scrollHeight - page.clientHeight;
        if (overflow > 0) console.warn(`[fit] ${where} overflows by ${overflow}px`);

        for (const element of page.querySelectorAll<HTMLElement>("*")) {
          const style = getComputedStyle(element);
          // Text cut short with an ellipsis, on one line or a set number, is clipped on purpose
          const isTruncated = style.textOverflow === "ellipsis" || style.webkitLineClamp !== "none";
          if (!["hidden", "clip"].includes(style.overflowY) || isTruncated) continue;
          const clipped = element.scrollHeight - element.clientHeight;
          if (clipped > 0) console.warn(`[fit] ${where} clips ${clipped}px of`, element);
        }
      }
    }
  };

  let timer: ReturnType<typeof setTimeout> | undefined;
  const scheduleCheck = () => {
    clearTimeout(timer);
    timer = setTimeout(check, SETTLE_MS);
  };
  document.fonts.ready.then(scheduleCheck);
  window.addEventListener("resize", scheduleCheck);
}
