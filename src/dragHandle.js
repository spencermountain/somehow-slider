const onFirstClick = function (e) {
  let el = e.target
  let dragStart = e.layerY

  const onDrag = function (event) {
    console.log(event.pageY)
  }

  // stop event
  window.addEventListener('pointerup', () => {
    window.removeEventListener('pointermove', onDrag)
    window.removeEventListener('pointerup', this)
  })
  window.addEventListener('pointermove', onDrag)
  // fire first
  // onDrag(e)
}

module.exports = onFirstClick
