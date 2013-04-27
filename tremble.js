// Generated by CoffeeScript 1.3.1
(function() {
  var Tremble, Trembler,
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
        intensity: 0.6,
        position: {
          x: 300,
          y: 500,
          z: 500
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

      var $container, ambient_light, m, n, range, trembler, _base, _base1, _base2, _base3, _i, _j, _k, _len, _len1, _ref, _ref1, _results;
      this.config = $.extend(true, {}, this.config, config);
      $container = $(this.config.container);
      if ((_base = this.config).width == null) {
        _base.width = $container.width();
      }
      if ((_base1 = this.config).height == null) {
        _base1.height = $container.height();
      }
      if ((_base2 = this.config.camera).aspect == null) {
        _base2.aspect = this.config.width / this.config.height;
      }
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(this.config.camera.view_angle, this.config.camera.aspect, this.config.camera.near, this.config.camera.far);
      $.extend(this.camera.position, this.config.camera.position);
      this.scene.add(this.camera);
      this.light = new THREE.PointLight(this.config.light.color, this.config.light.intensity);
      $.extend(this.light.position, this.config.light.position);
      this.scene.add(this.light);
      ambient_light = new THREE.AmbientLight(0x999999);
      this.scene.add(ambient_light);
      this.renderer = new THREE.WebGLRenderer();
      this.renderer.setSize(this.config.width, this.config.height);
      this.renderer.setClearColorHex(0xDDDDDD);
      range = (function() {
        _results = [];
        for (var _i = _ref = -this.config.factor, _ref1 = this.config.factor; _ref <= _ref1 ? _i <= _ref1 : _i >= _ref1; _ref <= _ref1 ? _i++ : _i--){ _results.push(_i); }
        return _results;
      }).apply(this);
      for (_j = 0, _len = range.length; _j < _len; _j++) {
        n = range[_j];
        if ((_base3 = this.trembler_map)[n] == null) {
          _base3[n] = {};
        }
        for (_k = 0, _len1 = range.length; _k < _len1; _k++) {
          m = range[_k];
          trembler = new Trembler({
            parent: this,
            speed: this.config.speed,
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
      TWEEN.update();
      this.camera.lookAt(new THREE.Vector3(70, 0, 300));
      this.renderer.render(this.scene, this.camera);
      if (this.state.started) {
        return window.requestAnimationFrame(this.render);
      }
    };

    return Tremble;

  })();

  Trembler = (function() {

    Trembler.name = 'Trembler';

    Trembler.prototype.config = {
      parent: null,
      index: [null, null],
      position: {
        x: 0,
        y: 0,
        z: 0
      },
      speed: 1,
      radius: 10,
      segments: 16,
      rings: 16,
      color: 0xCCCCCC,
      tremble: {
        base: 4
      },
      spike: {
        probability: 0.005,
        proximity_bias: 0.05,
        factor: 15
      }
    };

    Trembler.prototype.state = {
      spike: false,
      direction: null,
      tween: null
    };

    function Trembler(config) {
      this.config = $.extend(true, {}, this.config, config);
      this.state = $.extend(true, {}, this.state);
      this.geometry = new THREE.SphereGeometry(this.config.radius, this.config.segments, this.config.rings);
      this.mesh_material = new THREE.MeshPhongMaterial({
        color: this.config.color
      });
      this.mesh = new THREE.Mesh(this.geometry, this.mesh_material);
      this.mesh.position.set(this.config.position.x, this.config.position.y, this.config.position.z);
    }

    Trembler.prototype.start = function() {
      var _base;
      if ((_base = this.state).direction == null) {
        _base.direction = 1;
      }
      return this.tremble();
    };

    Trembler.prototype.get_neighbors = function() {
      var dx, dy, neighbor, neighbors, nx, ny, _i, _j, _len, _len1, _ref, _ref1;
      neighbors = [];
      _ref = [-1, 0, 1];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        dx = _ref[_i];
        _ref1 = [-1, 0, 1];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          dy = _ref1[_j];
          nx = this.config.index[0] + dx;
          ny = this.config.index[1] + dy;
          if (nx === this.config.index[0] && ny === this.config.index[1]) {
            continue;
          }
          neighbor = this.config.parent.get_trembler(nx, ny);
          if (neighbor != null) {
            neighbors.push(neighbor);
          }
        }
      }
      return neighbors;
    };

    Trembler.prototype.tremble = function() {
      var neighbor, spike_probability, tremble_amount, tremble_duration, trembler, tween, _i, _len, _ref;
      trembler = this;
      this.state.direction *= -1;
      if (this.state.direction === 1) {
        tremble_amount = Math.random() * this.config.tremble.base;
        spike_probability = Math.random();
        _ref = this.get_neighbors();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          neighbor = _ref[_i];
          if (neighbor.state.spike) {
            spike_probability += this.config.spike.proximity_bias;
          }
        }
        if (1 - spike_probability <= this.config.spike.probability) {
          this.state.spike = true;
          tremble_amount *= this.config.spike.factor;
        }
      } else {
        tremble_amount = -1 * this.mesh.position.y;
      }
      tremble_duration = 20 * this.config.speed + Math.random() * 30;
      if (this.state.spike) {
        tremble_duration *= 1.1;
      }
      tween = new TWEEN.Tween(this.mesh.position);
      tween.to({
        y: tremble_amount
      }, tremble_duration);
      tween.onUpdate(function() {
        return trembler.mesh.position.set(this.x, this.y, this.z);
      });
      tween.onComplete(function() {
        if (trembler.state.direction === -1) {
          trembler.state.spike = false;
        }
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
      width: $container.width(),
      height: $container.height(),
      speed: 1
    });
    return tremble.start();
  });

}).call(this);
