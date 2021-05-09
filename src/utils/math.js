const average = arr => arr.reduce((p, c) => parseFloat(p) + parseFloat(c), 0) / arr.length;
const max = arr => Math.max(...arr);
const min = arr => Math.min(...arr);

export {
  average,
  max,
  min
}