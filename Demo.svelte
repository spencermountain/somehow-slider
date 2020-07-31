<script>
  import { Horizontal, Vertical, Label, Latitude } from './src'
</script>

<style>
  .col {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
    text-align: center;
    flex-wrap: wrap;
    align-self: stretch;
  }
  .mt3 {
    margin-top: 3rem;
    margin-bottom: 3rem;
  }
  .link {
    text-decoration: underline;
    color: steelblue;
  }
</style>

<div class="col">
  <h2>
    <a class="link" href="https://github.com/spencermountain/somehow-slider">
      somehow-slider
    </a>
  </h2>
  <div>some handy slider (aka range) components in svelte</div>

  <h2 class="mt3">Horizontal:</h2>
  <div style="width:80%;">
    <Horizontal value={20} min={0} max={200}>
      <label start="10" end="20" color="red" label="beginning" />
      <label start="20" end="180" color="blue" label="middle" />
      <label start="180" end="190" color="red" label="end" />
    </Horizontal>
  </div>
  <div class="mt3" />

  <h2 class="mt3">Vertical:</h2>
  <div style="width:80%; height:300px;">
    <Vertical value="70" min={0} max={200}>
      <label start="10" end="20" color="red" label="beginning" />
      <label start="20" end="180" color="blue" label="middle" />
      <label start="180" end="190" color="red" label="end" />
    </Vertical>
  </div>
  <div class="mt3" style="width:80%; height:300px;">
    <Vertical value={0} min={0} max={200}>
      <label start="10" end="20" color="red" label="beginning" />
      <label start="20" end="180" color="blue" label="middle" />
      <label start="180" end="190" color="red" label="end" />
    </Vertical>
  </div>
  <div class="mt3" />
  <h2 class="mt3">Latitude:</h2>
  <div style="width:80%; height:300px;">
    <Latitude value={37} />
  </div>
  <div class="mt3" />
</div>
