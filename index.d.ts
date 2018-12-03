// convenient shortcut for functions taking 1 param
export type Fn<A, B> = (x: A) => B;

export type Const<R, A> = R & { _brand: A };

export type Either<A, B> =
  | { type: "Left"; value: A }
  | { type: "Right"; value: B };

export interface Monoid<A> {
  empty: () => A;
  concat: (xs: A[]) => A;
}

export interface Functor<A, B, FA, FB> {
  map(f: Fn<A, B>, x: FA): FB;
}

export interface Applicative<A, B, FA, FB> extends Functor<A, B, FA, FB> {
  pure: Fn<B, FB>;
  combine: (f: Fn<A[], B>, fas: FA[]) => FB;
}

export interface Getting<R, S, A> {
  "~~type~~": "Getting";
  "~~apply~~": <FA extends Const<R, A>, FS extends Const<R, S>>(
    F: Applicative<A, S, FA, FS>,
    f: Fn<A, FA>,
    s: S
  ) => FS;
}

export interface Getter<S, A> {
  "~~type~~": "Getting";
  "~~apply~~": <R, FA extends Const<R, A>, FS extends Const<R, S>>(
    F: Functor<A, S, FA, FS>,
    f: Fn<A, FA>,
    s: S
  ) => FS;
}

export interface Iso<S, T, A, B> {
  "~~type~~": "Getting" & "Iso" & "Lens" & "Traversal";
  "~~apply~~": (<FB, FT>(F: Functor<B, T, FB, FT>, f: Fn<A, FB>, s: S) => FT);
  from: (s: S) => A;
  to: (b: B) => T;
}

export interface Prism<S, T, A, B> {
  "~~type~~": "Getting" & "Prism" & "Traversal";
  "~~apply~~": (<FB, FT>(
    F: Applicative<B, T, FB, FT>,
    f: Fn<A, FB>,
    s: S
  ) => FT);
  match: (s: S) => Either<T, A>;
  build: (b: B) => T;
}

export interface Lens<S, T, A, B> {
  "~~type~~": "Getting" & "Lens" & "Traversal";
  "~~apply~~": (<FB, FT>(F: Functor<B, T, FB, FT>, f: Fn<A, FB>, s: S) => FT);
}

export interface Traversal<S, T, A, B> {
  "~~type~~": "Getting" & "Traversal";
  "~~apply~~": (<FB, FT>(
    F: Applicative<B, T, FB, FT>,
    f: Fn<A, FB>,
    s: S
  ) => FT);
}

// Monomorphic version
export type SimpleIso<S, A> = Iso<S, S, A, A>;
export type SimplePrism<S, A> = Prism<S, S, A, A>;
export type SimpleLens<S, A> = Lens<S, S, A, A>;
export type SimpleTraversal<S, A> = Traversal<S, S, A, A>;

// arity 2
export function compose<S, T, A, B, C, D>(
  parent: Iso<S, T, A, B>,
  child: Iso<A, B, C, D>
): Iso<S, T, C, D>;
export function compose<S, T, A, B, C, D>(
  parent: Prism<S, T, A, B>,
  child: Prism<A, B, C, D>
): Prism<S, T, C, D>;
export function compose<S, T, A, B, C, D>(
  parent: Lens<S, T, A, B>,
  child: Lens<A, B, C, D>
): Lens<S, T, C, D>;
export function compose<S, T, A, B, C, D>(
  parent: Traversal<S, T, A, B>,
  child: Traversal<A, B, C, D>
): Traversal<S, T, C, D>;
export function compose<S, A, B>(
  parent: Getter<S, A>,
  child: Getter<A, B>
): Getter<S, B>;
// arity 3
export function compose<S, T, A, B, C, D, E, F>(
  parent: Iso<S, T, A, B>,
  child1: Iso<A, B, C, D>,
  child2: Iso<C, D, E, F>
): Iso<S, T, E, F>;
export function compose<S, T, A, B, C, D, E, F>(
  parent: Prism<S, T, A, B>,
  child1: Prism<A, B, C, D>,
  child2: Prism<C, D, E, F>
): Prism<S, T, E, F>;
export function compose<S, T, A, B, C, D, E, F>(
  parent: Traversal<S, T, A, B>,
  child1: Traversal<A, B, C, D>,
  child2: Traversal<C, D, E, F>
): Traversal<S, T, E, F>;
export function compose<S, A, B, C>(
  parent: Getter<S, A>,
  child1: Getter<A, B>,
  child2: Getter<B, C>
): Getter<S, C>;
// arity 4
export function compose<S, T, A, B, C, D, E, F, G, H>(
  parent: Iso<S, T, A, B>,
  child1: Iso<A, B, C, D>,
  child2: Iso<C, D, E, F>,
  child3: Iso<E, F, G, H>
): Iso<S, T, G, H>;
export function compose<S, T, A, B, C, D, E, F, G, H>(
  parent: Prism<S, T, A, B>,
  child1: Prism<A, B, C, D>,
  child2: Prism<C, D, E, F>,
  child3: Prism<E, F, G, H>
): Prism<S, T, G, H>;
export function compose<S, T, A, B, C, D, E, F, G, H>(
  parent: Lens<S, T, A, B>,
  child1: Lens<A, B, C, D>,
  child2: Lens<C, D, E, F>,
  child3: Lens<E, F, G, H>
): Lens<S, T, G, H>;
export function compose<S, T, A, B, C, D, E, F, G, H>(
  parent: Traversal<S, T, A, B>,
  child1: Traversal<A, B, C, D>,
  child2: Traversal<C, D, E, F>,
  child3: Traversal<E, F, G, H>
): Traversal<S, T, G, H>;
export function compose<S, A, B, C, D>(
  parent: Getter<S, A>,
  child1: Getter<A, B>,
  child2: Getter<B, C>,
  child3: Getter<C, D>
): Getter<S, D>;
// arity 5
export function compose<S, T, A, B, C, D, E, F, G, H, I, J>(
  parent: Iso<S, T, A, B>,
  child1: Iso<A, B, C, D>,
  child2: Iso<C, D, E, F>,
  child3: Iso<E, F, G, H>,
  child4: Iso<G, H, I, J>
): Iso<S, T, I, J>;
export function compose<S, T, A, B, C, D, E, F, G, H, I, J>(
  parent: Prism<S, T, A, B>,
  child1: Prism<A, B, C, D>,
  child2: Prism<C, D, E, F>,
  child3: Prism<E, F, G, H>,
  child4: Prism<G, H, I, J>
): Prism<S, T, I, J>;
export function compose<S, T, A, B, C, D, E, F, G, H, I, J>(
  parent: Lens<S, T, A, B>,
  child1: Lens<A, B, C, D>,
  child2: Lens<C, D, E, F>,
  child3: Lens<E, F, G, H>,
  child4: Lens<G, H, I, J>
): Lens<S, T, I, J>;
export function compose<S, T, A, B, C, D, E, F, G, H, I, J>(
  parent: Traversal<S, T, A, B>,
  child1: Traversal<A, B, C, D>,
  child2: Traversal<C, D, E, F>,
  child3: Traversal<E, F, G, H>,
  child4: Traversal<G, H, I, J>
): Traversal<S, T, I, J>;
export function compose<S, A, B, C, D, E>(
  parent: Getter<S, A>,
  child1: Getter<A, B>,
  child2: Getter<B, C>,
  child3: Getter<C, D>,
  child4: Getter<D, E>
): Getter<S, E>;
// for higher arities you can use _.$().$()... of nest compose calls

export function over<S, T, A, B>(
  optic: Traversal<S, T, A, B>,
  updater: (a: A) => B,
  state: S
): T;

export function set<S, T, A, B>(
  optic: Traversal<S, T, A, B>,
  value: B,
  state: S
): T;

export function view<S, A>(optic: Getting<A, S, A>, state: S): A;

export function preview<S, A>(
  optic: Getting<A | null, S, A>,
  state: S
): A | null;

export function has<S, A>(optic: Getting<boolean, S, A>, state: S): boolean;

export function toList<S, A>(optic: Getting<A[], S, A>, state: S): A[];

export function append<S, A>(
  optic: SimpleTraversal<S, A[]>,
  item: A,
  state: S
): S;
export function insertAt<S, A>(
  optic: SimpleTraversal<S, A[]>,
  index: number,
  item: A,
  state: S
): S;
export function removeAt<S, A>(
  optic: SimpleTraversal<S, A[]>,
  index: number,
  state: S
): S;
export function removeIf<S, A>(
  optic: SimpleTraversal<S, A[]>,
  f: (x: A) => boolean,
  state: S
): S;

export function iso<S, T, A, B>(
  from: (s: S) => A,
  to: (b: B) => T
): Iso<S, T, A, B>;
export function from<S, T, A, B>(anIso: Iso<S, T, A, B>): Iso<B, A, T, S>;
export function withIso<S, T, A, B, R>(
  anIso: Iso<S, T, A, B>,
  f: (from: Fn<S, A>, to: Fn<B, T>) => R
): R;
export function non<A>(x: A): SimpleIso<A | null, A>;
export function anon<A>(x: A, f: Fn<A, boolean>): SimpleIso<A | null, A>;
// TODO: json :: SimpleIso<String,Object>
// TODO: mapEntries :: SimpleIso<Map<Key,Value>>, Array<[Key,Value]>

export function lens<S, T, A, B>(
  get: (s: S) => A,
  set: (b: B, s: S) => T
): Lens<S, T, A, B>;
export function prop<S, K extends keyof S>(name: K): SimpleLens<S, S[K]>;
export function index<A>(i: number): SimpleLens<[A], A>;
export function atProp<S, K extends keyof S>(
  name: K
): SimpleLens<S | null, S[K] | null>;
export function to<S, A>(getter: (s: S) => A): Getter<S, A>;

export function eachOf<A>(): SimpleTraversal<A[], A>;
export const each: SimpleTraversal<any[], any>;

export function filtered<A, B>(
  f: (x: A) => Boolean,
  traversal?: Traversal<A[], B[], A, B>
): Traversal<A[], B[], A, B>;
export function maybeProp<S, K extends keyof S>(
  name: K
): SimpleTraversal<S, S[K]>;
// TODO: eachValue :: SimpleTraversal<Map<K,V>, V>
// TODO: eachKey :: SimpleTraversal<Map<K,V>, K>

export function left<A, B>(a: A): Either<A, B>;
export function rght<A, B>(b: B): Either<A, B>;
export function prism<S, T, A, B>(
  match: (s: S) => Either<T, A>,
  build: (b: B) => T
): Prism<S, T, A, B>;
export function simplePrism<S, A>(
  match: (s: S) => A | null,
  build: (a: A) => S
): SimplePrism<S, A>;
export function withPrism<S, T, A, B, R>(
  aPrism: Prism<S, T, A, B>,
  f: (match: (s: S) => Either<T, A>, build: (b: B) => T) => R
): R;
// TODO: maybeJson :: SimplePrism<String,Object>

export type LensProxy<P, S> = SimpleLens<P, S> &
  (S extends object ? { [K in keyof S]: LensProxy<P, S[K]> } : {}) & {
    $<A>(child: SimpleLens<S, A>): LensProxy<P, A>;
    $<A>(child: SimpleTraversal<S, A>): TraversalProxy<P, A>;
    $<A>(child: Getter<S, A>): GetterProxy<P, A>;
  };

export type TraversalProxy<P, S> = SimpleTraversal<P, S> &
  (S extends object ? { [K in keyof S]: TraversalProxy<P, S[K]> } : {}) & {
    $<A>(child: SimpleTraversal<S, A>): TraversalProxy<P, A>;
    $<A>(child: Getter<S, A>): GetterProxy<P, A>;
  };

export type GetterProxy<P, S> = Getter<P, S> &
  (S extends object ? { [K in keyof S]: GetterProxy<P, S[K]> } : {}) & {
    $<A>(child: Getter<S, A>): GetterProxy<P, A>;
  };

export function lensProxy<P, S = P>(parent?: SimpleLens<P, S>): LensProxy<P, S>;
