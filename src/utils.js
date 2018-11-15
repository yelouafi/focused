export const id = x => x;
export const konst = x => _ => x;

export function curry2(f) {
  return function curried2(x, y) {
    if (arguments.length === 2) return f(x, y);
    return function curried2_1arg(y) {
      return f(x, y);
    };
  };
}

export function curry3(f) {
  return function curried3(x, y, z) {
    if (arguments.length === 3) return f(x, y, z);
    if (arguments.length === 2)
      return function curried3_2args(z) {
        return f(x, y, z);
      };
    return curry2(function curried3_1(y, z) {
      return f(x, y, z);
    });
  };
}
