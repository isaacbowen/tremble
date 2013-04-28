// Generated by CoffeeScript 1.3.1
(function() {
  var Network, Tremble, Trembler,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Tremble = (function() {

    Tremble.name = 'Tremble';

    Tremble.prototype.config = {
      container: '#container',
      speed: 1,
      factor: 7,
      camera: {
        aspect: null,
        near: 5,
        far: 10000,
        position: {
          x: 200,
          y: 700,
          z: 1000
        }
      },
      light: {
        color: 0xFFFFFF,
        intensity: 0.5,
        position: {
          x: 300,
          y: 500,
          z: 500
        }
      },
      trembler: {
        radius: 10,
        segments: 16,
        rings: 16,
        color: 0xCCCCCC,
        tremble: {
          base: 5
        },
        spike: {
          probability: 0.001,
          bias: 50,
          restore_probability: 0.1,
          restore_bias: 10,
          base: 50
        }
      }
    };

    Tremble.prototype.state = {
      started: false
    };

    Tremble.prototype.trembler_map = {};

    Tremble.prototype.tremblers = [];

    function Tremble(config) {
      this.render = __bind(this.render, this);

      var m, n, range, trembler, _base, _i, _j, _k, _len, _len1, _ref, _ref1, _results;
      this.config = $.extend(true, {}, this.config, config);
      this.resize();
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(this.config.camera.view_angle, this.config.camera.aspect, this.config.camera.near, this.config.camera.far);
      $.extend(this.camera.position, this.config.camera.position);
      this.camera.lookAt(new THREE.Vector3(70, 0, 300));
      this.scene.add(this.camera);
      this.light = new THREE.PointLight(this.config.light.color, this.config.light.intensity);
      $.extend(this.light.position, this.config.light.position);
      this.scene.add(this.light);
      this.light = new THREE.HemisphereLight(0xFFFFFF, 0xCCCCCC, 0.7);
      this.scene.add(this.light);
      this.renderer = new THREE.WebGLRenderer();
      this.renderer.setSize(this.config.width, this.config.height);
      this.renderer.setClearColor(0xDDDDDD);
      range = (function() {
        _results = [];
        for (var _i = _ref = -this.config.factor, _ref1 = this.config.factor; _ref <= _ref1 ? _i <= _ref1 : _i >= _ref1; _ref <= _ref1 ? _i++ : _i--){ _results.push(_i); }
        return _results;
      }).apply(this);
      for (_j = 0, _len = range.length; _j < _len; _j++) {
        n = range[_j];
        if ((_base = this.trembler_map)[n] == null) {
          _base[n] = {};
        }
        for (_k = 0, _len1 = range.length; _k < _len1; _k++) {
          m = range[_k];
          trembler = new Trembler({
            parent: this,
            config: this.config,
            index: [n, m],
            position: {
              x: n * 100,
              z: m * 100
            }
          });
          this.trembler_map[n][m] = trembler;
          this.tremblers.push(trembler);
          this.scene.add(trembler.mesh);
        }
      }
      $(this.config.container).append(this.renderer.domElement);
    }

    Tremble.prototype.resize = function() {
      var $container;
      $container = $(this.config.container);
      this.config.width = $container.width();
      this.config.height = $container.height();
      this.config.camera.aspect = this.config.width / this.config.height;
      if (this.camera) {
        console.log('updating camera');
        this.camera.aspect = this.config.camera.aspect;
        this.camera.updateProjectionMatrix();
      }
      if (this.renderer) {
        console.log('updating renderer');
        return this.renderer.setSize(this.config.width, this.config.height);
      }
    };

    Tremble.prototype.get_trembler = function(x, y) {
      return this.trembler_map[x] && this.trembler_map[x][y];
    };

    Tremble.prototype.start = function() {
      var trembler, _i, _len, _ref;
      this.state.started = true;
      _ref = this.tremblers;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        trembler = _ref[_i];
        trembler.start();
      }
      return this.render();
    };

    Tremble.prototype.render = function(time) {
      var trembler, _i, _len, _ref, _ref1;
      TWEEN.update();
      _ref = this.tremblers;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        trembler = _ref[_i];
        if (((_ref1 = trembler.network) != null ? _ref1.size : void 0) === this.tremblers.length) {
          trembler.network.kill();
        }
      }
      this.renderer.render(this.scene, this.camera);
      if (this.state.started) {
        return window.requestAnimationFrame(this.render);
      }
    };

    return Tremble;

  })();

  Network = (function() {

    Network.name = 'Network';

    function Network(root) {
      this.root = root;
      this.tremblers = [root];
      this.size = 1;
      this.color = Math.floor(Math.random() * 0xFFFFFF);
    }

    Network.prototype.add_trembler = function(trembler) {
      this.tremblers.push(trembler);
      return this.size++;
    };

    Network.prototype.kill = function() {
      var trembler, _i, _len, _ref, _results;
      _ref = this.tremblers;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        trembler = _ref[_i];
        trembler.state.spike = false;
        _results.push(trembler.network = null);
      }
      return _results;
    };

    return Network;

  })();

  Trembler = (function() {

    Trembler.name = 'Trembler';

    Trembler.prototype.state = {
      spike: false,
      direction: null,
      tween: null
    };

    function Trembler(opts) {
      this.config = opts.config, this.index = opts.index, this.position = opts.position, this.parent = opts.parent;
      this.state = $.extend(true, {}, this.state);
      this.geometry = new THREE.SphereGeometry(this.config.trembler.radius, this.config.trembler.segments, this.config.trembler.rings);
      this.mesh_material = new THREE.MeshPhongMaterial({
        color: this.config.trembler.color,
        overdraw: true
      });
      this.mesh = new THREE.Mesh(this.geometry, this.mesh_material);
      this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    }

    Trembler.prototype.start = function() {
      var _base;
      if ((_base = this.state).direction == null) {
        _base.direction = 1;
      }
      return this.tremble();
    };

    Trembler.prototype.get_neighbors = function(spikes) {
      var dx, dy, neighbor, neighbors, nx, ny, _i, _j, _len, _len1, _ref, _ref1;
      neighbors = [];
      _ref = [-1, 0, 1];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        dx = _ref[_i];
        _ref1 = [-1, 0, 1];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          dy = _ref1[_j];
          if ((dx === dy && dy === 0)) {
            continue;
          }
          nx = this.index[0] + dx;
          ny = this.index[1] + dy;
          neighbor = this.parent.get_trembler(nx, ny);
          if (neighbor != null) {
            if (spikes && !neighbor.state.spike) {
              continue;
            }
            neighbors.push(neighbor);
          }
        }
      }
      return neighbors;
    };

    Trembler.prototype.tremble = function() {
      var local_network, local_network_size, p, spike_probability, spiked_neighbors, tremble_duration, tremble_to, trembler, tween, _ref, _ref1, _ref2;
      spiked_neighbors = this.get_neighbors(true);
      local_network = (_ref = spiked_neighbors[0]) != null ? _ref.network : void 0;
      local_network_size = (local_network != null ? local_network.size : void 0) || 0;
      if (!(local_network != null ? (_ref1 = local_network.root) != null ? (_ref2 = _ref1.state) != null ? _ref2.spike : void 0 : void 0 : void 0)) {
        local_network_size = 0;
      }
      this.state.direction *= -1;
      if (this.state.direction === 1) {
        if (!this.state.spike) {
          if (spiked_neighbors.length >= 4 && spiked_neighbors < 8) {
            this.state.spike = true;
          } else {
            spike_probability = Math.random();
            spike_probability += (this.config.trembler.spike.probability * this.config.trembler.spike.bias) * Math.sqrt(local_network_size);
            if (1 - spike_probability <= this.config.trembler.spike.probability) {
              this.state.spike = true;
            }
          }
        }
        if (this.state.spike && !this.network) {
          if (spiked_neighbors.length === 0) {
            this.network = new Network(this);
          } else {
            this.network = spiked_neighbors[0].network;
            this.network.add_trembler(this);
          }
        }
      } else {
        if (this.state.spike) {
          if (!this.network.root.state.spike) {
            this.state.spike = false;
          } else {
            p = Math.random();
            if (this.network.root !== this) {
              p -= (this.config.trembler.spike.restore_probability * this.config.trembler.spike.restore_bias) * Math.sqrt(local_network_size);
            }
            if (1 - p <= this.config.trembler.spike.restore_probability) {
              this.state.spike = false;
            }
          }
        }
        if (!this.state.spike) {
          this.network = null;
        }
      }
      tremble_to = 0;
      if (this.state.direction === 1) {
        tremble_to += Math.random() * this.config.trembler.tremble.base;
      }
      tremble_duration = 10 * this.config.speed + Math.random() * 50;
      if (this.state.spike) {
        tremble_to += this.config.trembler.spike.base;
        this.mesh_material.color.setHex(this.network.color);
      } else {
        this.mesh_material.color.setHex(this.config.trembler.color);
      }
      trembler = this;
      tween = new TWEEN.Tween(this.mesh.position);
      tween.to({
        y: tremble_to
      }, tremble_duration);
      tween.onUpdate(function() {
        return trembler.mesh.position.set(this.x, this.y, this.z);
      });
      tween.onComplete(function() {
        return trembler.tremble();
      });
      return tween.start();
    };

    Trembler.prototype.render = function(time) {};

    return Trembler;

  })();

  $(function() {
    var $container, tremble;
    $container = $('#container');
    tremble = window.tremble = new Tremble({
      container: $container,
      speed: 10
    });
    tremble.start();
    return $(window).resize(function() {
      return tremble.resize();
    });
  });

}).call(this);
