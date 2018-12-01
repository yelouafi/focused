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
  __type: "Getting";
  __applyOptic: <FA extends Const<R, A>, FS extends Const<R, S>>(
    F: Applicative<A, S, FA, FS>,
    f: Fn<A, FA>,
    s: S
  ) => FS;
}

export interface Getter<S, A> {
  __type: "Getting";
  __applyOptic: <R, FA extends Const<R, A>, FS extends Const<R, S>>(
    F: Functor<A, S, FA, FS>,
    f: Fn<A, FA>,
    s: S
  ) => FS;
}

export interface Iso<S, T, A, B> {
  __type: "Getting" & "Iso" & "Lens" & "Traversal";
  __applyOptic: (<FB, FT>(F: Functor<B, T, FB, FT>, f: Fn<A, FB>, s: S) => FT);
  from: (s: S) => A;
  to: (b: B) => T;
}

export interface Prism<S, T, A, B> {
  __type: "Getting" & "Prism" & "Traversal";
  __applyOptic: (<FB, FT>(
    F: Applicative<B, T, FB, FT>,
    f: Fn<A, FB>,
    s: S
  ) => FT);
  match: (s: S) => Either<T, A>;
  build: (b: B) => T;
}

export interface Lens<S, T, A, B> {
  __type: "Getting" & "Lens" & "Traversal";
  __applyOptic: (<FB, FT>(F: Functor<B, T, FB, FT>, f: Fn<A, FB>, s: S) => FT);
}

export interface Traversal<S, T, A, B> {
  __type: "Getting" & "Traversal";
  __applyOptic: (<FB, FT>(
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

export function compose<S, T, A, B, X, Y>(
  parent: Iso<S, T, A, B>,
  child: Iso<A, B, X, Y>
): Iso<S, T, X, Y>;
export function compose<S, T, A, B, X, Y>(
  parent: Prism<S, T, A, B>,
  child: Prism<A, B, X, Y>
): Prism<S, T, X, Y>;
export function compose<S, T, A, B, X, Y>(
  parent: Lens<S, T, A, B>,
  child: Lens<A, B, X, Y>
): Lens<S, T, X, Y>;
export function compose<S, T, A, B, X, Y>(
  parent: Traversal<S, T, A, B>,
  child: Traversal<A, B, X, Y>
): Traversal<S, T, X, Y>;
export function compose<S, T, A, B, X, Y>(
  parent: Getter<S, A>,
  child: Getter<A, X>
): Getter<S, X>;

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
export function index<S>(i: number): SimpleLens<[A], A>;
export function atProp<S, K extends keyof S>(
  name: K
): SimpleLens<S | null, S[K] | null>;
export function to<S, A>(getter: (s: S) => A): Getter<S, A>;

export function each<A>(): SimpleTraversal<A[], A>;

export function filter<A, B>(
  f: (x: A) => Boolean,
  traversal?: Traversal<A[], B[], A, B>
): Traversal<A[], B[], A, B>;
export function maybeProp<S, K extends keyof S>(
  name: K
): SimpleTraversal<S, S[K]>;
// eachValue :: SimpleTraversal<Map<K,V>, V>
// eachKey :: SimpleTraversal<Map<K,V>, K>

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
// maybeJson : SimplePrism<String,Object>

export type LensProxy<P, S> = SimpleLens<P, S> &
  { [K in keyof S]: LensProxy<P, S[K]> } & {
    $<A>(child: SimpleLens<S, A>): LensProxy<P, A>;
    $<A>(child: SimpleTraversal<S, A>): TraversalProxy<P, A>;
  };

export type TraversalProxy<P, S> = SimpleTraversal<P, S> &
  { [K in keyof S]: TraversalProxy<P, S[K]> } & {
    $<A>(child: SimpleTraversal<S, A>): TraversalProxy<P, A>;
  };

export function lensProxy<P, S = P>(parent?: SimpleLens<P, S>): LensProxy<P, S>;
