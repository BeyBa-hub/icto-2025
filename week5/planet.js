const day = 24.0 * 60 * 60; // тривалість земного дня у секундах
const dt = day/12 // крок інтегрування
const G = 6.67e-11; // гравітаційна стала
const scale = 1e9; // масштаб для позицій у сцені

AFRAME.registerComponent('planet', {
  schema: {
    name: { type: 'string', default: "" }, // ім'я планети
    dist: { type: 'number', default: 0 }, // середня відстань від Сонця
    mass: { type: 'number', default: 0 }, // маса
    T: { type: 'number', default: 0 }, // планетарний рік у земних днях
    v: { type: 'array', default: [0, 0, 0] }, // вектор швидкості
    a: { type: 'array', default: [0, 0, 0] }, // вектор прискорення
    pos: { type: 'array', default: [0, 0, 0] } // координатний вектор
  },

  init: function () {
    setTimeout(() => {
      this.data.T *= day;
      this.data.pos[0] = this.data.dist;
      this.el.setAttribute('position', (this.data.dist / 1e9) + ' 0 0');

      if (this.data.T !== 0) {
        this.data.v[2] = 2 * Math.PI * this.data.dist / this.data.T;
      }
    }, 100); // Затримка 100 мс
}

});

AFRAME.registerComponent('main', {
  init: function () {
    this.solar_system = document.querySelectorAll('[planet]');
  },

  tick: function (time, deltaTime) {
    for (let i = 0; i < this.solar_system.length; i++) {
      let planet_i = this.solar_system[i].getAttribute('planet');
      planet_i.a = [0, 0, 0];

      for (let j = 0; j < this.solar_system.length; j++) {
        if (i !== j) {
          let planet_j = this.solar_system[j].getAttribute('planet');
          let deltapos = [0, 0, 0];

          for (let k = 0; k < 3; k++) {
            deltapos[k] = planet_j.pos[k] - planet_i.pos[k];
          }

          let r = Math.sqrt(
            deltapos[0] ** 2 + deltapos[1] ** 2 + deltapos[2] ** 2
          );

          if (r !== 0) {
            for (let k = 0; k < 3; k++) {
              planet_i.a[k] += (G * planet_j.mass * deltapos[k]) / Math.pow(r, 3);
            }
          }
        }
      }

      for (let k = 0; k < 3; k++) {
        planet_i.v[k] += planet_i.a[k] * dt;
        planet_i.pos[k] += planet_i.v[k] * dt;
      }
     
      this.solar_system[i].setAttribute(
        'position',
        (planet_i.pos[0] / scale) + ' ' + (planet_i.pos[1] / scale) + ' ' + (planet_i.pos[2] / scale)
      );
    }
  }
});
