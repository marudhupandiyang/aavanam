String.prototype.count = function(c) {
  let result = 0;
  for(let i = 0; i < this.length; i += 1) {
    if ( this[i] == c) {
      result += 1;
    }
  }
  return result;
};
