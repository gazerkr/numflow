const { feature } = require('../../../../dist/cjs/index.js')

module.exports = feature({
  contextInitializer: (ctx, req, res) => {
    ctx.userId = 'test-user'
  }
})
