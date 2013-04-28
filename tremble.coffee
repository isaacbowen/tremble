class Tremble
  config:
    container: '#container'
    speed: 1
    factor: 7

    camera:
      aspect: null
      near: 5
      far: 10000
      position:
        x: 200
        y: 700
        z: 1000

    light:
      color: 0xFFFFFF
      intensity: 0.5
      position:
        x: 300
        y: 500
        z: 500

    trembler:
      radius: 10
      segments: 16
      rings: 16
      color: 0xCCCCCC

      tremble:
        base: 5
      spike:
        probability: 0.001
        bias: 50
        restore_probability: 0.1
        restore_bias: 10
        base: 50

  state:
    started: false

  trembler_map: {}
  tremblers: []

  constructor: (config) ->
    @config = $.extend true, {}, @config, config

    @resize()

    # cause a scene
    @scene = new THREE.Scene()

    # look here
    @camera = new THREE.PerspectiveCamera(
      @config.camera.view_angle,
      @config.camera.aspect,
      @config.camera.near,
      @config.camera.far,
    )
    $.extend @camera.position, @config.camera.position
    @camera.lookAt(new THREE.Vector3(70, 0, 300))
    @scene.add @camera

    # light it up
    @light = new THREE.PointLight @config.light.color, @config.light.intensity
    $.extend @light.position, @config.light.position
    @scene.add @light

    @light = new THREE.HemisphereLight 0xFFFFFF, 0xCCCCCC, 0.7
    # $.extend @light.position, @config.light.position
    @scene.add @light

    # here
    @renderer = new THREE.WebGLRenderer()
    @renderer.setSize @config.width, @config.height
    @renderer.setClearColor 0xDDDDDD

    # that which trembles
    range = [-@config.factor..@config.factor]
    for n in range
      @trembler_map[n] ?= {}

      for m in range
        trembler = new Trembler
          parent: this
          config: @config
          index: [n, m]
          position:
            x: n * 100
            z: m * 100

        @trembler_map[n][m] = trembler
        @tremblers.push trembler
        @scene.add trembler.mesh

    # add to container
    $(@config.container).append @renderer.domElement

  resize: ->
    $container = $(@config.container)
    @config.width = $container.width()
    @config.height = $container.height()
    @config.camera.aspect = @config.width / @config.height

    if @camera
      console.log 'updating camera'
      @camera.aspect = @config.camera.aspect
      @camera.updateProjectionMatrix()
    if @renderer
      console.log 'updating renderer'
      @renderer.setSize @config.width, @config.height

  get_trembler: (x, y) -> @trembler_map[x] and @trembler_map[x][y]

  start: ->
    @state.started = true
    trembler.start() for trembler in @tremblers

    @render()

  render: (time) =>
    TWEEN.update()

    # have we been overcome?
    for trembler in @tremblers
      if trembler.network?.size == @tremblers.length
        # @config.trembler.color = trembler.network.color
        trembler.network.kill()

    @renderer.render @scene, @camera

    # if we've been started, do the loop
    if @state.started
      window.requestAnimationFrame(@render)

class Network
  constructor: (root) ->
    @root = root
    @tremblers = [root]
    @size = 1

    @color = Math.floor(Math.random() * 0xFFFFFF)

  add_trembler: (trembler) ->
    @tremblers.push trembler
    @size++

  kill: ->
    for trembler in @tremblers
      trembler.state.spike = false
      trembler.network = null


class Trembler
  state:
    spike: false
    direction: null
    tween: null

  constructor: (opts) ->
    {@config, @index, @position, @parent} = opts

    @state = $.extend true, {}, @state

    @geometry = new THREE.SphereGeometry(
      @config.trembler.radius,
      @config.trembler.segments,
      @config.trembler.rings,
    )

    @mesh_material = new THREE.MeshPhongMaterial(
      color: @config.trembler.color
      overdraw: true
    )

    @mesh = new THREE.Mesh @geometry, @mesh_material
    @mesh.position.set(
      @position.x,
      @position.y,
      @position.z,
    )

  start: ->
    # up is down, I guess
    @state.direction ?= 1

    # begin
    @tremble()

  get_neighbors: (spikes) ->
    neighbors = []

    for dx in [-1, 0, 1]
      for dy in [-1, 0, 1]
        continue if dx == dy == 0

        nx = @index[0] + dx
        ny = @index[1] + dy

        neighbor = @parent.get_trembler(nx, ny)

        if neighbor?
          if spikes and not neighbor.state.spike
            continue
          neighbors.push neighbor

    neighbors

  tremble: ->
    spiked_neighbors = @get_neighbors(true)

    local_network = spiked_neighbors[0]?.network
    local_network_size = local_network?.size or 0
    local_network_size = 0 unless local_network?.root?.state?.spike

    # switch direction
    @state.direction *= -1

    # shall we spike?
    if @state.direction == 1 # up
      unless @state.spike
        if spiked_neighbors.length >= 4
          @state.spike = true
        else
          spike_probability = Math.random()
          spike_probability += (@config.trembler.spike.probability * @config.trembler.spike.bias) * local_network_size

          if 1 - spike_probability <= @config.trembler.spike.probability
            @state.spike = true

      if @state.spike and not @network
        if spiked_neighbors.length == 0
          @network = new Network this
        else
          @network = spiked_neighbors[0].network
          @network.add_trembler this

    # shall we unspike?
    else
      if @state.spike
        if not @network.root.state.spike
          @state.spike = false
        else
          p = Math.random()

          # spike roots are, oddly, more fragile
          unless @network.root == this
            p -= (@config.trembler.spike.restore_probability * @config.trembler.spike.restore_bias) * local_network_size

          if 1 - p <= @config.trembler.spike.restore_probability
            @state.spike = false

      if not @state.spike
        @network = null

    # where to?
    tremble_to = 0
    if @state.direction == 1
      tremble_to += Math.random() * @config.trembler.tremble.base

    # duration
    tremble_duration = 10 * @config.speed + Math.random() * 50

    # handle spike conditions
    if @state.spike
      tremble_to += @config.trembler.spike.base
      @mesh_material.color.setHex @network.color
    else
      @mesh_material.color.setHex @config.trembler.color

    # build the tween
    trembler = this
    tween = new TWEEN.Tween @mesh.position
    tween.to y: tremble_to, tremble_duration
    tween.onUpdate ->
      trembler.mesh.position.set @x, @y, @z
    tween.onComplete ->
      # brannigan
      trembler.tremble()

    # start that tween
    tween.start()

  render: (time) ->
    # most of this is just up to the tween singleton

$ ->
  $container = $('#container')
  tremble = window.tremble = new Tremble
    container: $container
    speed: 10
  tremble.start()

  $(window).resize -> tremble.resize()
