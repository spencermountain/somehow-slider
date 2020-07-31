<script>
  import scaleLinear from '../scale'
  import onFirstClick from '../dragHandler'
  export let value = 0
  export let max = 100
  export let min = 0
  let scale = scaleLinear({ world: [0, 100], minmax: [min, max] })
  let percent = scale(value)

  function startClick(e) {
    onFirstClick(e, res => {
      percent = res.percent.y * 100
      value = scale.backward(percent)
    })
  }
  function handleKeydown(event) {
    if (event.key === 'ArrowLeft') {
      percent -= 1
      value = scale.backward(percent)
    }
    if (event.key === 'ArrowRight') {
      percent += 1
      value = scale.backward(percent)
    }
    event.preventDefault()
  }
</script>

<style>
  .container {
    position: relative;
    height: 40px;
    width: 100%;
    cursor: pointer;
    outline: none;
  }
  .background {
    position: absolute;
    background-color: lightgrey;
    border-radius: 8px;
    box-shadow: 2px 2px 8px 0px rgba(0, 0, 0, 0.2);
    top: 33%;
    height: 33%;
    width: 100%;
    touch-action: none;
  }
  .handle {
    position: relative;
    border-radius: 8px;
    box-shadow: 2px 2px 8px 0px rgba(0, 0, 0, 0.2);
    position: absolute;
    width: 15px;
    height: 100%;
    cursor: col-resize;
    border: 1px solid grey;
    position: relative;
    background-color: steelblue;
    touch-action: none;
  }
  .number {
    position: absolute;
    top: 50px;
    user-select: none;
  }
</style>

<!-- <div>{value}</div>
<div>{percent}</div> -->
<div class="container" on:pointerdown={startClick} on:keydown={handleKeydown}>
  <div class="background" />
  <div class="handle" style="left:{percent}%;" on:pointerdown={startClick}>
    <div class="number">{Math.round(value)}</div>
  </div>
</div>
