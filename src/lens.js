/*
    type Lens<S,T,A,B> = (Functor<F>, A => F<B>, S) => F<T>
    type SimpleLens<S,A> = Lens<S,S,A,A>
*/

// lens : (S => A, (B,S) => T) => Lens<S,T,A,B>
export function lens(getter, setter) {
  return function gsLens(aFunctor, f, s) {
    return aFunctor.map(a2 => setter(a2, s), f(getter(s)));
  };
}

// prop : K => SimpleLens<S,S[K]>
// PARTIAL : will throw if name isn't a prop of the target
export function prop(name) {
  return lens(
    s => {
      if (!s.hasOwnProperty(name)) {
        throw new Error(
          `object ${JSON.stringify(s)} doesn't have property ${name}`
        );
      }
      return s[name];
    },
    (a, s) =>
      Object.assign({}, s, {
        [name]: a
      })
  );
}

// index : number => SimpleLens<[A], A>
// PARTIAL : will throw if idx is out of bounds
export function index(idx) {
  return function indexLens(aFunctor, f, xs) {
    if (idx < 0 || idx >= xs.length) {
      throw new Error("index out of bounds!");
    }
    return aFunctor.map(a2 => {
      const ys = xs.slice();
      ys[idx] = a2;
      return ys;
    }, f(xs[idx]));
  };
}

// atProp : K => SimpleLens<Maybe<S>, Maybe<S[K]>>
export function atProp(key) {
  return function atKeyLens(aFunctor, f, s) {
    let a = s !== null && s.hasOwnProperty(key) ? s[key] : null;
    return aFunctor.map(a2 => {
      if (a2 === null) {
        if (a === null || s === null) return s;
        const copy = Object.assign({}, s);
        delete copy[key];
        return copy;
      } else {
        return Object.assign({}, s, { [key]: a2 });
      }
    }, f(a));
  };
}

// to : (S => A) => SimpleLens<S,A>
export function to(getter) {
  return lens(getter, () => {
    throw new Error("Can not modify the value of a getter");
  });
}
