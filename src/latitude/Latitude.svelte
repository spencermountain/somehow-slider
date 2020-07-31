<script>
  import {
    Globe,
    Graticule,
    Latitude,
    Countries
  } from '/Users/spencer/mountain/somehow-maps/src/'
  import onFirstClick from '../dragHandler'
  import scaleLinear from '../scale'
  export let value = 0
  value -= 90
  value *= -1 //sorry
  export let max = 180
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
    if (event.key === 'ArrowUp') {
      percent -= 1
      value = scale.backward(percent)
    }
    if (event.key === 'ArrowDown') {
      percent += 1
      value = scale.backward(percent)
    }
    event.preventDefault()
  }
  const fmt = function(val) {
    val = Math.round(val)
    val = val - 90
    val = -1 * val
    return val + '°'
  }
</script>

<style>
  .container {
    position: relative;
    height: 300px;
    width: 300px;
    cursor: pointer;
    outline: none;
  }
  .background {
    position: absolute;
    /* background-color: lightgrey; */
    border: 1px solid lightgrey;
    border-radius: 8px;
    /* box-shadow: 2px 2px 8px 0px rgba(0, 0, 0, 0.2); */
    top: 0%;
    height: 100%;
    width: 100%;
    touch-action: none;
  }
  .handle {
    position: relative;
    border-radius: 8px;
    /* box-shadow: 2px 2px 8px 0px rgba(0, 0, 0, 0.2); */
    position: absolute;
    width: 115%;
    left: -7.5%;
    height: 10px;
    cursor: row-resize;
    position: relative;
    background-color: #5ea1ca;
    touch-action: none;
  }
  .number {
    position: relative;
    font-size: 25px;
    top: -10px;
    background-color: #fbfbfb;
    opacity: 0.8;
    border-radius: 10px;
    display: inline;
    border: 4px solid #5ea1ca;
    /* border-bottom: 4px solid #cc7066; */
    padding-top: 5px;
    padding-left: 10px;
    padding-right: 5px;
    color: steelblue;
    /* color: #d68881; */
    /* left: 150px; */
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

  <div class="background" style="">
    <Globe tilt={-10} rotate="30" width="300" height="300">
      <Graticule />
      <Countries color="lightgrey" />
      <Latitude at={0} width="0.8" color="grey" />
    </Globe>
  </div>
  <div class="handle" style="top:{percent}%;" on:pointerdown={startClick}>
    <div class="number">{fmt(value)}</div>
  </div>
</div>
