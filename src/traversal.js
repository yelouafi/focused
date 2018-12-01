import { id } from "./utils";
import { compose } from "./operations";
import { mapEntries } from "./iso";
import { index } from "./lens";
/*
    type Traversal<S,T,A,B> = (Applicative<F>, A => F<B>, S) => F<T>
    type SimpleTraversal<S,A> = Traversal<S,S,A,A>
*/

// each : Traversal< Array<A>, Array<B>, A, B>
function _each(anApplicative, f, xs) {
  return anApplicative.combine(id, xs.map(f));
}

export function each() {
  return _each;
}

// filter : (A => Boolean) => Traversal< Array<A>, Array<B>, A, B>
export function filtered(pred, traverse = _each) {
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

// eachValue :: SimpleTraversal<Map<K,V>, V>
export const eachMapValue = compose(
  mapEntries,
  _each,
  index(1)
);

// eachKey :: SimpleTraversal<Map<K,V>, K>
export const eachMapKey = compose(
  mapEntries,
  _each,
  index(0)
);
