# focused

A library to deal with Immutable updates in JavaScript. Based on the famous lens library from Haskell. Wrapped in a convenient Proxy interface.

# Install

```js
yarn add focused
```

or

```sh
npm install --save focused
```

# Tutorial

Lenses, or Optics in general, are an elegant way, from functional programming, to access and update immutable data structures. Simply put, an optic gives us a reference, also called a _focus_, to a nested part of a data structure. Once we build a focus (using some helper), we can use given functions to access or update, immutably, the embedded value.

In the following tutorial, we'll introduce Optics using `focused` helpers. The library is meant to be friendly for JavaScript developers who are not used to FP jargon.

We'll use the following object as a test bed

```js
import { lensProxy, set, ... } from "focused";

const state = {
  name: "Luffy",
  level: 4,
  nakama: [
    { name: "Zoro", level: 3 },
    { name: "Sanji", level: 3 },
    { name: "Chopper", level: 2 }
  ]
};

// we'll use this as a convenient way to access deep properties in the state
const _ = lensProxy();
```

## Focusing on a single value

Here is our first example, using the `set` function:

```js
const newState = set(_.name, "Mugiwara", state);
// => { name: "Mugiwara", ... }
```

above, `set` takes 3 arguments:

1. `_.name` is a _Lens_ which lets us focus on the `name` property inside the `state` object
2. The new value which replaces the old one
3. The state to operate on.

It then returns a new state, with the `name` property replaced with the new value.

`over` is like `set` but takes a function instead of a constant value

```js
const newState = over(_.level, x => x * 2, state);
// => { name: "Luffy", level: 8, ... }
```

As you may have noticed, `set` is just a shortcut for `over(lens, _ => newValue, state)`.

Besides properties, we can access elements inside an array

```js
set(_.nakama[0].name, "Jimbi", state);
```

It's important to remember that a lens focuses _exactly_ on 1 value. no more, no less. In the above example, accessing a non existing property on `state` (or out of bound index) will throw an error.

If you want the access to silently fail, you can prefix the property name with `$`.

```js
const newState = over(_.$assistant.$level, x => x * 2, state);
// newState == state
```

`_.$assistant` is sometimes called an _Affine_, which is a focus on _at most_ one value (ie 0 or 1 value).

There is also a `view` function, which provides a read only access to a Lens

```js
view(_.name, state);
// => Luffy
```

You're probably wondering, what's the utility of the above function, since the access can be trivially achieved with `state.name`. That's true, but lenses can allow some advanced accesses which are not as trivial to achieve as the above case, especially when combined with other optics as we'll see.

Similarly, `preview` can be used with Affines to safely dereference deeply nested values

```js
preview(_.$assitant.$level, state);
// null
```

## Focusing on multiple values

As we said, Lenses can focus on a single value. To focus on multiple values, we can use the `each` optic together with `toList` function (`view` can only view a single value).

For example, to gets the `name`s of all Luffy's `nakama`

```js
toList(_.nakama.$(each).name, state);
// => ["Zoro", "Sanji", "Chopper"]
```

Note how we wrapped `each` inside the `.$()` method of the proxy. `.$()` lets us insert arbitrary optics in the access path which will be automatically composed with the other optics in the chain.

In optics jargon, `each` is called a _Traversal_. It's an optic which can focus on multiple parts inside a data structure. Note that traversals are not restricted to lists. You can create your own traversals for any _Traversable_ data structure (eg Maps, trees, linked lists ...).

Of course, traversals work automatically with update functions like `over`. For example

```js
over(_.nakama.$(each).name, s => s.toUpperCase(), state);
```

returns a new state with all `nakama` names uppercased.

Another traversal is `filtered` which can restrict the focus only to parts meeting some criteria. For example

```js
toList(_.nakama.$(filtered(x => x.level > 2)).name, state);
// => ["Zoro", "Sanji"]
```

retrieves all `nakama`s names with level above `2`. While

```js
over(_.nakama.$(filtered(x => x.level > 2)).name, s => s.toUpperCase(), state);
```

upates all `nakama`s names with level above `2`.

## When the part and the whole matches

Suppose we have the following json

```js
const pkgJson = `{
  "name": "my-package",
  "version": "1.0.0",
  "description": "Simple package",
  "main": "index.html",
  "scripts": {
    "start": "parcel index.html --open",
    "build": "parcel build index.html"
  },
  "dependencies": {
      "mydep": "6.0.0"
  }
}
`;
```

And we want to focus on the `mydep` field inside `dependencies`. With normal JS code, we can call `JSON.parse` on the json string, modify the field on the created object, then call `JSON.stringify` on the same object to create the new json string.

It turns out that optics has got a first class concept for the above operations. When the whole (source JSON) and the part (object created by `JSON.parse`) _matches_ we call that an _Isomorphism_ (or simply _Iso_). In the above example we can create an isomorphism between the JSON string and the corresponding JS object using the `iso` function

```js
const json = iso(JSON.parse, JSON.stringify);
```

`iso` takes 2 functions: one to go from the source to the target, and the other to go back.

> Note this is a partial optic since `JSON.parse` can fail. We've got another optic (oh yeah) for the one that can account for failure

Ok, so having the `json` Iso, we can use it with the standard functions, for example

```js
set(_.$(json).dependencies.mydep, "6.1.0", pkgJson);
```

returns another JSON string with the `mydep` modified. Abstracting over the parsing/stringifying steps.

The previous example is nice, but it'd be nicer if we can get access to the semver string `6.0.0` as a regular JS object. Let's go a little further and create another Isomorphism for semver like strings

```js
const semver = iso(
  s => {
    const [major, minor, patch] = s.split(".").map(x => +x);
    return { major, minor, patch };
  },
  ({ major, minor, patch }) => [major, minor, patch].join(".")
);
```

Now we can have a focus directly on the parts of a semver string as numbers. Below

```js
over(_.$(json).dependencies.mydep.$(semver).minor, x => x + 1, jsonObj);
```

increments the minor directly in the JSON string.

> Of course, we abstracted over failures in the semver Iso.

## When the match can't always succeed

As I mentioned, the previous case was not a total Isomorphism because JSON strings aren't always parsed to JS objects. So, as you may expect, we need to introduce another fancy name, this time our optic is called a `Prism`. Which is an Isomorphism that may fail when going from the source to the target (but which always succeeds when going back).

A simple way to create a Prism is the `simplePrism` function. It's like `iso` but you return `null` when the conversion fails.

```js
const maybeJson = simplePrism(s => {
  try {
    return JSON.parse(s);
  } catch (e) {
    return null;
  }
}, JSON.stringify);
```

So now,something like

```js
const badJSonObj = "@#" + jsonObj;
set(_.$(maybeJson).dependencies.mydep, "6.1.0", badJSonObj);
```

will simply return the original JSON string. The conversion of the `semver` Iso to a prism is left as a simple exercise.

## Todo

- [ ] add documentation (how to create optics, more examples, API ...)
- [ ] add typings
- [ ] Indexed Traversals
- [ ] port more operators from Haskell lens library (with use case justification)

