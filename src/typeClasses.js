export const Void = {
  empty: () => {
    throw "Void.empty! (you're likely using view with a Traversal, try preview or toList instead)";
  },
  concat: () => {
    throw "Void.concat! (you're likely using view with a Traversal, try preview or toList instead)";
  }
};

export const List = {
  empty: () => [],
  concat: xxs => [].concat(...xxs),
  pure: x => [x],
  map: (f, xs) => xs.map(f)
};

export const First = {
  empty: () => null,
  concat2: (x1, x2) => (x1 !== null ? x1 : x2),
  concat: xs => xs.reduce(First.concat2, null)
};

export const Any = {
  empty: () => false,
  concat2: (x1, x2) => x1 || x2,
  concat: xs => xs.reduce(Any.concat2, false)
};

export const Identity = {
  pure: x => x,
  map: (f, x) => f(x),
  combine: (f, xs) => f(xs)
};

export const Const = aMonoid => ({
  pure: _ => aMonoid.empty(),
  map: (f, x) => x,
  combine: (_, xs) => aMonoid.concat(xs)
});

export const ConstVoid = Const(Void);
export const ConstList = Const(List);
export const ConstFirst = Const(First);
export const ConstAny = Const(Any);
