/*
    type Either<T,A> = { type: "LEFT", value: T } | { type: "RIGHT", value: A }

    type Prism<S,T,A,B> = 
            (Applicative<F>, A => F<B>, S) => F<T> 
        &   { __IS_PRISM: true, match: S => Either<T,A>, to: B => T }

    type SimplePrism<S,A> = Prism<S,S,A,A>
*/

export function left(value) {
  return { type: "LEFT", value };
}

export function right(value) {
  return { type: "RIGHT", value };
}

// prism : (S => Either<T,A>, B => T) => Prism<S,T,A,B>
export function prism(match, build) {
  function prismFn(anApplicative, f, s) {
    const result = match(s);
    if (result.type === "LEFT") return anApplicative.pure(result.value);
    const fa = f(result.value);
    return anApplicative.map(build, fa);
  }
  // escape hatch to avoid profunctors
  Object.assign(prismFn, {
    __IS_PRISM: true,
    build,
    match
  });
  return prismFn;
}

// simplePrism : (S => Maybe<A>, A => S) => SimplePrism<S,A>
export function simplePrism(match, build) {
  return prism(s => {
    const result = match(s);
    return result === null
      ? { type: "LEFT", value: s }
      : { type: "RIGHT", value: result };
  }, build);
}

// withPrism : (Prism<S,T,A,B>, (S => Either<T,A>, B => T) => R) => R
export function withPrism(aPrism, f) {
  return f(aPrism.match, aPrism.build);
}

// parent : Prism<S,T,A,B>  &   { match: S => Either<T,A>, to: B => T }
// child  : Prism<A,B,X,Y>  &   { match: A => Either<B,X>, to: Y => B }
// return : Prism<S,T,X,Y>  &   { match: S => Either<T,X>, to: Y => T }
export function compose2Prisms(parentL, childL) {
  const { match: sta, build: bt } = parentL;
  const { match: abx, build: yb } = childL;
  return prism(
    s => {
      const ta = sta(s);
      if (ta.type === "LEFT") return ta;
      const bx = abx(ta.value);
      if (bx.type === "RIGHT") return bx;
      return bt(bx.value);
    },
    y => bt(yb(y))
  );
}

// json : SimplePrism<String,Object>
export const maybeJson = simplePrism(s => {
  try {
    return JSON.parse(s);
  } catch (e) {
    return null;
  }
}, JSON.stringify);
