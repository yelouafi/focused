export const id = x => x;
export const konst = x => _ => x;

export function curry2(f) {
  return function curried2(x, y) {
    if (arguments.length >= 2) return f(x, y);
    return function curried2_1arg(y) {
      return f(x, y);
    };
  };
}

export function curry3(f) {
  return function curried3(x, y, z) {
    if (arguments.length >= 3) return f(x, y, z);
    if (arguments.length === 2) {
      return function curried3_2args(z) {
        return f(x, y, z);
      };
    }
    return curry2(function curried3_1(y, z) {
      return f(x, y, z);
    });
  };
}

export function curry4(f) {
  return function curried4(w, x, y, z) {
    if (arguments.length >= 4) return f(w, x, y, z);
    if (arguments.length === 3) {
      return function curried4_3args(z) {
        return f(w, x, y, z);
      };
    }
    if (arguments.length === 2) {
      return curry2(function curried4_2args(y, z) {
        return f(w, x, y, z);
      });
    }
    return curry3(function curried4_1(x, y, z) {
      return f(w, x, y, z);
    });
  };
}
