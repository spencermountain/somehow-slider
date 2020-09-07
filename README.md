<div align="center">
  <div><b>somehow-slider</b></div>
  <img src="https://user-images.githubusercontent.com/399657/68222691-6597f180-ffb9-11e9-8a32-a7f38aa8bded.png"/>
  <div>— part of <a href="https://github.com/spencermountain/somehow">somehow</a> —</div>
  <div>WIP svelte infographics</div>
  <div align="center">
    <sub>
      by
      <a href="https://spencermounta.in/">Spencer Kelly</a> 
    </sub>
  </div>
</div>
<div align="right">
  <a href="https://npmjs.org/package/somehow-slider">
    <img src="https://img.shields.io/npm/v/somehow-slider.svg?style=flat-square" />
  </a>
</div>
<img height="25px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>

<div align="center">
  <code>npm install somehow-slider</code>
</div>

<div align="center">
**work-in-progress**
</div>

```html
<script>
  import { Horizontal, Slider, Label } from './src'
</script>
<Horizontal bind:value min="{0}" max="{200}">
  <label start="10" end="20" color="red" label="beginning" />
  <label start="20" end="180" color="blue" label="middle" />
  <label start="180" end="190" color="red" label="end" />
</Horizontal>
```

![image](https://user-images.githubusercontent.com/399657/92410478-3048bc80-f112-11ea-9a90-2a8ae7613fe9.png)

## API

- Vertical
- Horizontal
- Label

MIT
