<div align="center">
  <img src="https://cloud.githubusercontent.com/assets/399657/23590290/ede73772-01aa-11e7-8915-181ef21027bc.png" />
  <div>svelte slider elements</div>

  <a href="https://npmjs.org/package/somehow-input">
    <img src="https://img.shields.io/npm/v/somehow-input.svg?style=flat-square" />
  </a>
  <a href="https://unpkg.com/somehow-input">
    <img src="https://badge-size.herokuapp.com/spencermountain/somehow-input/master/builds/somehow.min.js" />
  </a>
</div>

<div align="center">
  <code>npm install somehow-slider</code>
</div>

<div align="center">
**work-in-progress**
</div>

```html
<script>
  import { Horizontal, Slider } from './src'
</script>
<Horizontal bind:value min="{0}" max="{200}">
  <label start="10" end="20" color="red" label="beginning" />
  <label start="20" end="180" color="blue" label="middle" />
  <label start="180" end="190" color="red" label="end" />
</Horizontal>
```

## API

- Vertical
- Horizontal

MIT
