
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

updates all `nakama`s names with level above `2`.

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

So now, something like

```js
const badJSonObj = "@#" + jsonObj;
set(_.$(maybeJson).dependencies.mydep, "6.1.0", badJSonObj);
```

will simply return the original JSON string. The conversion of the `semver` Iso to a prism is left as a simple exercise.

# Documentation

Using optics follows a uniform pattern
- First we create an optic which focuses on some value(s) inside a container
- Then we use an operation to access or modify the value through the created optic

In the following, all functions are imported from the `focused` package
  
## Creating Optics

As seen in the tutorial,`lensProxy` offers a convenient way to create optics which focus on javascript objects and arrays. `lensProxy` is essentially a façade API which uses explicit functions behind the scene. In the following examples, we'll see both the proxy and the coresponding explicit functions.

### Object properties
As we saw in the tutorial, we use the familiar property access notation to focus on an object property. For example

```js
const _ = lensProxy()
const nameProp = _.name
```

creates a lens which focuses on the `name` property of an object.

Using the explicit style, we can use the the `prop` function

```js
const nameProp = prop("name")
```
As said previously, **a lens focuses exactly on one value**, it means the value must exist in the target container (in this sense the `prop` lens is *partial*). For example, if you use `nameProp` on an object which doesn't have a `name` property, it will throw an error.

### Array elements
As with object properties, we use the array index notation. For example

```js
const _ = lensProxy()
const firstElem = _[0]
```
creates a lens that focuses on the first element on an array. The underlying function is `index`, so we could also write

```js
const firstElem = index(0)
```

### Creating custom lenses

The `lens` function can be used to create arbitrary lenses. The (monomorphic) signature of the function is

```js
lens<S,A>(
	getter: S => A, 
	setter: (A,S) => S
) => SimpleLens<S,A>
```
>I'm using pseudo typescript signatures that omit the names of function parameters: `S => A` means a function which takes a single parameter of type `S` and returns a parameter of type `A`. `S` and `A` are called *Generic types* and are used as placeholders for arbitrary types, for example,  we can obtain `string` => `number` by substituting `S` with `string` and `A` with `number`.

The `lens` function takes 2 parameters

- `getter` is used to extract the focus value from the target container
- `setter` is used to update the target container with a new focus value.

And returns a `SimpleLens<S,A>` which you can simply view as an abstract type:  it's the lens object which focus on a value of type `A` inside a container of type `S`.

>The type is called `SimpleLens` because there is a more general *polymorphic* type of lenses which can also modify the type of the target container. But for now, we just focus (pun intended) on *monomorphic* lenses which just return the same type when updating.

For example

```js
/*
type Person = {
  name: string
}

nameProp: SimpleLens<Person, string>
*/
const nameProp = lense(
	s => s.name,
	(value, s) => ({...s, name: value})
) 
```
is equivalent to the `nameProp` lens we saw earlier.

As you may have guessed, both `prop` and `index` can be implemented using `lens`

### Composing lenses

>Generally you can combine any 2 optics together, even if they're of different kind (eg you can combine lenses with traversals)

A nice property of lenses, and optics in general, is that they can be combined to create a focus on deeply nested values. For example

```js
const _ = lensProxy()
const street = _.freinds[0].address.street
```
creates a lens which focuses  on the `street` of the `address` of the first element of the `freinds` array. As a matter of comparaison, let's say we want to update, immutably, the `street` property on a given object `person`. Using JavaScript spread syntax

```js
const firstFreind = person.freinds[0];
const newPerson = {
  ...person,
  freinds: [
    {
      ...firstFreind,
      address: {
        ...firstFreind.address,
        street: "new street"
      }
    },
    ...person.freinds.slice(1)
  ]
};
```

The equivalent operation in `focused` lenses is
```js
const newPerson = set(_.freinds[0].address.street, "new street", person)
```
We're chaining `.` accesses to successively focus on deeply nested values. Behind the scene, `lensProxy` is creating the necessary `prop` and `index` lenses, then composing them using `compose` function. Using explicit style, the above lens could be rewritten like

```js
const streetLens = compose(
  prop("freinds"),
  index(0),
  prop("address"),
  prop("street")
);
```

The important thing to remember here, is that`lensProxy` is essentially doing the same thing in the above `compose` example. Plus some memoization tricks to ensure that lenses are created only once and reused on subsequent operations

(TBD)

## Todo
- [ ] completing documentation (how to create optics, more examples, API ...)
- [ ] add typings
- [ ] Indexed Traversals
- [ ] port more operators from Haskell lens library (with use case justification)
