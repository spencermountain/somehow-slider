const getBox = function (e) {
  let el = e.target
  for (let i = 0; i < 7; i += 1) {
    if (el.classList.contains('container') === true) {
      break
    }
    el = el.parentNode || el
  }
  console.log(el)
  return el.getBoundingClientRect()
}

// handle initial click
const goHere = function (e, cb) {
  let outside = getBox(e)
  let res = {
    start: {},
    diff: {},
    value: {
      x: e.screenX - outside.left,
      y: e.screenY - outside.top,
    },
  }
  res.percent = {
    x: res.value.x / outside.width,
    y: res.value.y / outside.height,
  }
  cb(res)
}

const onFirstClick = function (e, cb) {
  let outside = getBox(e)
  let start = {
    x: e.screenX - outside.left,
    y: e.screenY - outside.top,
  }
  const onDrag = function (event) {
    let res = {
      start: start,
      diff: {
        x: event.screenX - start.x - outside.left,
        y: event.screenY - start.y - outside.top,
      },
    }
    res.value = {
      x: event.screenX - outside.left,
      y: event.screenY - outside.top,
    }
    // ensure values are within bounds
    if (res.value.x > outside.width) {
      res.value.x = outside.width
    }
    if (res.value.y > outside.height) {
      res.value.y = outside.height
    }
    if (res.value.x < 0) {
      res.value.x = 0
    }
    if (res.value.y < 0) {
      res.value.y = 0
    }
    // finally, calculate percents
    res.percent = {
      x: res.value.x / outside.width,
      y: res.value.y / outside.height,
    }
    cb(res)
  }

  // stop event
  window.addEventListener('pointerup', () => {
    window.removeEventListener('pointermove', onDrag)
    window.removeEventListener('pointerup', this)
  })
  window.addEventListener('pointermove', onDrag)
  // fire first
  goHere(e, cb)
}

module.exports = onFirstClick
