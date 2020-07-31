<script>
  import { Horizontal, Vertical, Label } from './src'
  let value = 20
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
</style>

<div class="col">
  <div>
    <a href="https://github.com/spencermountain/somehow-slider">
      somehow-slider
    </a>
  </div>
  <div>some handy svelte slider (aka range) components</div>

  <h2 class="mt3">Horizontal:</h2>
  <div style="width:80%;">
    <!-- <Horizontal bind:value min={0} max={200}>
      <label start="10" end="20" color="red" label="beginning" />
      <label start="20" end="180" color="blue" label="middle" />
      <label start="180" end="190" color="red" label="end" />
    </Horizontal> -->
  </div>
  <div class="mt3" />

  <h2 class="mt3">Vertical:</h2>
  <div style="width:80%; height:300px;">
    <Vertical bind:value min={0} max={200}>
      <label start="10" end="20" color="red" label="beginning" />
      <label start="20" end="180" color="blue" label="middle" />
      <label start="180" end="190" color="red" label="end" />
    </Vertical>
  </div>
  <div class="mt3" />
</div>
