/*
    type Traversal<S,T,A,B> = (Applicative<F>, A => F<B>, S) => F<T>
    type SimpleTraversal<S,A> = Traversal<S,S,A,A>
*/

// each : Traversal< Iterable<A>, Iterable<B>, A, B>
export function each(anApplicative, f, xs) {
  const fs = [];
  for (let x of xs) {
    fs.push(f(x));
  }
  return anApplicative.zip(fs);
}

// filter : (A => Boolean) => Traversal< Iterable<A>, Iterable<B>, A, B>
export function filtered(pred, traverse = each) {
  return function filterTraversal(anApplicative, f, s) {
    return traverse(anApplicative, update, s);

    function update(v) {
      return pred(v) ? f(v) : anApplicative.pure(v);
    }
  };
}

// maybeProp :: K => SimpleTraversal<S, S[K]>
// This is an Affine Traversal; ie focus on 0 or 1 value
export function maybeProp(name) {
  return function propTraversal(anApplicative, f, s) {
    if (!s.hasOwnProperty(name)) {
      return anApplicative.pure(s);
    }
    return anApplicative.map(a2 => {
      return Object.assign({}, s, {
        [name]: a2
      });
    }, f(s[name]));
  };
}
