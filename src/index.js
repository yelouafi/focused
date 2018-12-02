import { curry3, curry4 } from "./utils";
import { over } from "./operations";
export {
  iso,
  from,
  withIso,
  non,
  anon,
  json,
  mapEntries,
  compose2Isos
} from "./iso";
export { prop, index, lens, atProp } from "./lens";
export {
  prism,
  withPrism,
  simplePrism,
  left,
  right,
  maybeJson,
  compose2Prisms
} from "./prism";
export {
  each,
  eachOf,
  filtered,
  maybeProp,
  eachMapKey,
  eachMapValue
} from "./traversal";
export {
  view,
  preview,
  toList,
  has,
  over,
  set,
  compose,
  compose2
} from "./operations";
export { lensProxy, idLens } from "./lensProxy";

function _append(lens, x, s) {
  return over(lens, xs => xs.concat([x]), s);
}

function _insertAt(lens, index, x, s) {
  return over(
    lens,
    xs => {
      return xs
        .slice(0, index)
        .concat([x])
        .concat(xs.slice(index));
    },
    s
  );
}

function _removeIf(lens, p, s) {
  return over(lens, xs => xs.filter((x, i) => !p(x, i)), s);
}

function _removeAt(lens, index, s) {
  return removeIf(lens, (_, i) => i === index, s);
}

export const append = curry3(_append);
export const insertAt = curry4(_insertAt);
export const removeIf = curry3(_removeIf);
export const removeAt = curry3(_removeAt);
