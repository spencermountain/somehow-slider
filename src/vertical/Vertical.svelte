<script>
  import scaleLinear from '../scale'
  export let value = 0
  export let max = 100
  export let min = 0
  let scale = scaleLinear({ world: [0, 100], minmax: [min, max] })
  let percent = scale(value)
  let dragStart = 0
  let el = null
  // let status = 'init'

  const moveHandle = function(e) {
    console.log(e.target)
    if (el.isSameNode(e.target) === true) {
      return
    }
    let total = e.target.clientHeight
    let val = e.layerY || 0

    percent = (val / total) * 100
    if (percent > 100) {
      percent = 100
    }
    if (percent < 0) {
      percent = 0
    }
    value = scale.backward(percent)
  }
  // end drag event
  const mouseUp = function(e) {
    stopDrag(e)
  }
  const didDrag = function(e) {
    moveHandle(e)
  }
  const stopDrag = function(e) {
    window.removeEventListener('pointermove', didDrag)
    window.removeEventListener('pointerup', mouseUp)
  }
  function startClick(e) {
    dragStart = e.layerY
    window.addEventListener('pointermove', didDrag)
    window.addEventListener('pointerup', mouseUp)
    moveHandle(e)
  }
  function handleKeydown(event) {
    if (event.key === 'ArrowUp') {
      percent -= 1
      value = scale.backward(percent)
    }
    if (event.key === 'ArrowDown') {
      percent += 1
      value = scale.backward(percent)
    }
  }
</script>

<style>
  .container {
    position: relative;
    height: 100%;
    width: 40px;
    cursor: pointer;
  }
  .background {
    position: absolute;
    background-color: lightgrey;
    border-radius: 8px;
    box-shadow: 2px 2px 8px 0px rgba(0, 0, 0, 0.2);
    top: 0%;
    height: 100%;
    width: 100%;
    touch-action: none;
  }
  .handle {
    position: relative;
    border-radius: 8px;
    box-shadow: 2px 2px 8px 0px rgba(0, 0, 0, 0.2);
    position: absolute;
    width: 100%;
    height: 15px;
    cursor: row-resize;
    border: 1px solid grey;
    position: relative;
    background-color: steelblue;
    touch-action: none;
  }
  .number {
    position: absolute;
    left: 50px;
    user-select: none;
  }
</style>

<!-- <div>{value}</div>
<div>{percent}</div> -->
<div
  class="container"
  on:pointerdown={startClick}
  on:keydown={handleKeydown}
  tabindex="0">
  <div class="background" />
  <div
    class="handle"
    style="top:{percent}%;"
    on:pointerdown={startClick}
    bind:this={el}>
    <div class="number">{Math.round(value)}</div>
  </div>
</div>
