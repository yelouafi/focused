/*
    type Iso<S,T,A,B> = (Functor<F>, A => F<B>, S) => F<T>  &   
                        { from: S => A, to: B => T }

    type SimpleIso<S,A> = Iso<S,S,A,A>
*/

// iso : (S => A, B => T) => Iso<S,T,A,B>
export function iso(from, to) {
  function isoFn(aFunctor, f, s) {
    return aFunctor.map(to, f(from(s)));
  }
  // escape hatch to avoid profunctors
  Object.assign(isoFn, {
    __IS_ISO: true,
    from,
    to
  });
  return isoFn;
}

// withIso : (Iso<S,T,A,B>, (S => A, B => T) => R) => R
export function withIso(anIso, f) {
  return f(anIso.from, anIso.to);
}

// parent : Iso<S,T,A,B>       from: S => A, to: B => T
// child  : Iso<A,B,X,Y>       from: A => X, to: Y => B
// return : Iso<S,T,X,Y>       from: S => X, to: Y => T
export function compose2Isos(parent, child) {
  const { from: sa, to: bt } = parent;
  const { from: ax, to: yb } = child;
  return iso(s => ax(sa(s)), y => bt(yb(y)));
}

// from : Iso<S,T,A,B> => Iso<B,A,T,S>
export function from(anIso) {
  return iso(anIso.to, anIso.from);
}

// non : a => SimpleIso<Maybe<A> without a, A>
export function non(a) {
  return iso(
    //from : Maybe<A\a> -> a
    m => (m === null ? a : m),
    //to   : a -> Maybe<A\a>
    x => (x === a ? null : x)
  );
}

// non : (a, A -> boolean) => SimpleIso<Maybe<A> where pred(A) == false, a>
export function anon(a, pred) {
  return iso(m => (m === null ? a : m), x => (pred(x) ? null : x));
}

// json : SimpleIso<String,Object>
export const json = iso(JSON.parse, JSON.stringify);

// SimpleIso<Map<Key,Value>>, Array<[Key,Value]>
export const mapEntries = iso(map => [...map.entries()], kvs => new Map(kvs));
