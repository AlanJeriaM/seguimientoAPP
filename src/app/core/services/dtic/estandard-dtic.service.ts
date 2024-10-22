import { Injectable } from '@angular/core';

const caracteres =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

@Injectable({
  providedIn: 'root'
})
export class EstandardDticService {


  constructor() {}

  getRegistros() {
    var registros = [];
    for (let i = 0; i < 30; i++) {
      var random1 = this.getRandomInt(2);
      var random2 = this.getRandomInt(5);
      registros.push({
        id: i,
        dataA: `dataA_${i + 1}`,
        dataB: `dataB_${i + 1}`,
        dataC: `dataC_${i + 1}`,
        dataD: `dataD_${i + 1}`,
        randomA: `randomA_${random1}`,
        randomB: `randomB_${random2}`,
      });
    }
    return registros;
  }

  private getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
  }

  getRandomString(max: number) {
    var id = '';
    for (var i = 0; i < max; i++) {
      id += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return id;
  }
}
