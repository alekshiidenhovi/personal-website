<!--
  Corner crop marks framing the positioned element they're placed in. Restyle
  them with --crop-size, --crop-weight and --crop-color on that element.
-->
<template>
  <span class="crop top left" aria-hidden="true"></span>
  <span class="crop top right" aria-hidden="true"></span>
  <span class="crop bottom left" aria-hidden="true"></span>
  <span class="crop bottom right" aria-hidden="true"></span>
</template>

<style scoped>
.crop {
  position: absolute;
  width: var(--crop-size, 1.25rem);
  height: var(--crop-size, 1.25rem);
  border: 0 solid var(--crop-color, var(--card-color));
}

.top {
  top: 0;
  border-top-width: var(--crop-weight, 2px);
}

.bottom {
  bottom: 0;
  border-bottom-width: var(--crop-weight, 2px);
}

.left {
  left: 0;
  border-left-width: var(--crop-weight, 2px);
}

.right {
  right: 0;
  border-right-width: var(--crop-weight, 2px);
}
</style>
