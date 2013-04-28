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
      intensity: 0.6
      position:
        x: 300
        y: 500
        z: 500

  state:
    started: false

  trembler_map: {}
  tremblers: []

  constructor: (config) ->
    @config = $.extend true, {}, @config, config

    $container = $(@config.container)
    @config.width ?= $container.width()
    @config.height ?= $container.height()
    @config.camera.aspect ?= @config.width / @config.height

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
    @scene.add @camera

    # light it up
    @light = new THREE.PointLight @config.light.color, @config.light.intensity
    $.extend @light.position, @config.light.position
    @scene.add @light

    # extra ambient light
    ambient_light = new THREE.AmbientLight 0x999999
    @scene.add ambient_light

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
          speed: @config.speed
          index: [n, m]
          position:
            x: n * 100
            z: m * 100

        @trembler_map[n][m] = trembler
        @tremblers.push trembler
        @scene.add trembler.mesh

    # add to container
    $(@config.container).append @renderer.domElement

  get_trembler: (x, y) -> @trembler_map[x] and @trembler_map[x][y]

  start: ->
    @state.started = true
    trembler.start() for trembler in @tremblers

    @render()

  render: (time) =>
    TWEEN.update()
    @camera.lookAt(new THREE.Vector3(70, 0, 300))
    @renderer.render @scene, @camera

    # if we've been started, do the loop
    if @state.started
      window.requestAnimationFrame(@render)

class Trembler
  config:
    parent: null
    index: [null, null]

    position:
      x: 0
      y: 0
      z: 0
    speed: 1
    radius: 10
    segments: 16
    rings: 16
    color: 0xCCCCCC

    tremble:
      base: 5
    spike:
      probability: 0.005
      bias: 50
      restore_probability: 0.8
      base: 50

  state:
    spike: false
    direction: null
    tween: null

  constructor: (config) ->
    @config = $.extend true, {}, @config, config
    @state = $.extend true, {}, @state

    @geometry = new THREE.SphereGeometry(
      @config.radius,
      @config.segments,
      @config.rings,
    )

    @mesh_material = new THREE.MeshPhongMaterial color: @config.color

    @mesh = new THREE.Mesh @geometry, @mesh_material
    @mesh.position.set @config.position.x, @config.position.y, @config.position.z

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

        nx = @config.index[0] + dx
        ny = @config.index[1] + dy

        neighbor = @config.parent.get_trembler(nx, ny)

        if neighbor?
          if spikes and not neighbor.state.spike
            continue
          neighbors.push neighbor

    neighbors

  tremble: ->
    spiked_neighbor_count = @get_neighbors(true).length

    # switch direction
    @state.direction *= -1

    # shall we spike?
    if @state.direction == 1 # up
      unless @state.spike
        spike_probability = Math.random()
        spike_probability += (@config.spike.probability * @config.spike.bias) * spiked_neighbor_count

        if 1 - spike_probability <= @config.spike.probability
          @state.spike = true

    # shall we unspike?
    else
      if @state.spike
        spike_probability = Math.random()
        spike_probability += (@config.spike.probability * @config.spike.bias) * spiked_neighbor_count

        if 1 - spike_probability <= @config.spike.restore_probability
          @state.spike = false

    # where to?
    tremble_to = 0
    tremble_to += @config.spike.base if @state.spike

    if @state.direction == 1
      tremble_to += Math.random() * @config.tremble.base

    # duration
    tremble_duration = 10 * @config.speed + Math.random() * 50

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
    width: $container.width()
    height: $container.height()
    speed: 10
  tremble.start()
