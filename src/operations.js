import { id, konst, curry2, curry3 } from "./utils";
import {
  ConstAny,
  ConstFirst,
  ConstList,
  ConstVoid,
  Identity,
  List
} from "./typeClasses";
import { compose2Isos } from "./iso";
import { compose2Prisms } from "./prism";

/*
  type Settable<S,T,A,B>  = (Identity, A => Identity<B>, S) => Identity<T>
  type Getting<R,S,A>     = (Const<R>, A => Const<R,A>, S) => Const<R,S>
  type Getter<S,A>        = <R>Getting<R,S,A> -- ie should work for any R
 */

// view : Getting<A,S,A> => S => A
export const view = curry2(function _view(aGetter, s) {
  return aGetter(ConstVoid, id, s);
});

function _over(aSettable, f, s) {
  return aSettable(Identity, f, s);
}

// over : Settable<S,T,A,B> => (A => B) => S => T
export const over = curry3(_over);

// set : Settable<S,T,A,B> => B => S => T
export const set = curry3(function _set(aSettable, v, s) {
  return _over(aSettable, konst(v), s);
});

// toList : Getting<[A], S,A> => S => [A]
export const toList = curry2(function toList(aGetting, s) {
  return aGetting(ConstList, List.pure, s);
});

// preview : Getting<A | null, S,A> => S => (A | null)
export const preview = curry2(function _preview(aGetting, s) {
  return aGetting(ConstFirst, id, s);
});

// has : (Getting<Boolean, S,A>, S) => Boolean
export const has = curry2(function _has(aGetting, s) {
  return aGetting(ConstAny, konst(true), s);
});

/**
 * Compose 2 optics, Abstarcting the constraints, the type can be seen as
 *
 *    compose2 : (Optic<S,T,A,B>, Optic<A,B,X,Y>) => Optic<S,T,A,B>
 *
 * However, we need also to combine 2 Isos into an Iso and idem for Prisms
 * In Haskell this is acheived using type classes & Profunctors
 *
 * Here we're just inspecting types at runtime, it's ugly and less flexible but
 * works for our limited cases. Most notably, I don't want to introduce Profunctors
 * for performance reasons.
 */
export function compose2(parent, child) {
  // ad-hoc polymporphism FTW
  if (parent.__IS_ISO && child.__IS_ISO) {
    return compose2Isos(parent, child);
  }
  if (parent.__IS_PRISM && child.__IS_PRISM) {
    return compose2Prisms(parent, child);
  }
  return function composedOptics(F, f, s) {
    return parent(F, a => child(F, f, a), s);
  };
}

export function compose(...ls) {
  return ls.reduce(compose2);
}
