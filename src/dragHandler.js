const onFirstClick = function (e, cb) {
  let outside = e.target.parentNode.getBoundingClientRect()

  let start = {
    x: e.pageX - outside.left,
    y: e.pageY - outside.top,
  }
  const onDrag = function (event) {
    let res = {
      start: start,
      diff: {
        x: event.pageX - start.x - outside.left,
        y: event.pageY - start.y - outside.top,
      },
    }
    res.value = {
      x: event.pageX - outside.left,
      y: event.pageY - outside.top,
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
  onDrag(e, cb)
}

module.exports = onFirstClick
