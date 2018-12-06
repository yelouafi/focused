
# focused

Yet another Optics library for JavaScript, based on the famous lens library from Haskell. Wrapped in a convenient Proxy interface.

Dismissing all the FP jargon, this library will allow you to:

- Create functional referances (Optics), i.e. like pointers to nested parts in data structures (e.g. Object properties, Array elements, Map keys/values, or even fancier parts like a number inside a string ...).
- Apply immutable updates to data structures pointed by those functional references.

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

It's important to remember that a Lens focuses _exactly_ on 1 value. no more, no less. In the above example, accessing a non existing property on `state` (or out of bound index) will throw an error.

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

You're probably wondering, what's the utility of the above function, since the access can be trivially achieved with `state.name`. That's true, but Lenses allows more advanced accesses that are not as trivial to achieve as the above case, especially when combined with other Optics as we'll see.

Similarly, `preview` can be used with Affines to safely dereference deeply nested values

```js
preview(_.$assitant.$level, state);
// null
```

## Focusing on multiple values

As we said, Lenses can focus on a single value. To focus on multiple values, we can use the `each` Optic together with `toList` function (`view` can only view a single value).

For example, to gets the `name`s of all Luffy's `nakama`

```js
toList(_.nakama.$(each).name, state);
// => ["Zoro", "Sanji", "Chopper"]
```

Note how we wrapped `each` inside the `.$()` method of the proxy. `.$()` lets us insert arbitrary Optics in the access path which will be automatically composed with the other Optics in the chain.

In Optics jargon, `each` is called a _Traversal_. It's an optic which can focus on multiple parts inside a data structure. Note that Traversals are not restricted to lists. You can create your own Traversals for any _Traversable_ data structure (eg Maps, trees, linked lists ...).

Of course, Traversals work automatically with update functions like `over`. For example

```js
over(_.nakama.$(each).name, s => s.toUpperCase(), state);
```

returns a new state with all `nakama` names uppercased.

Another Traversal is `filtered` which can restrict the focus only to parts meeting some criteria. For example

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

It turns out that Optics has got a first class concept for the above operations. When the whole (source JSON) and the part (object created by `JSON.parse`) _matches_ we call that an _Isomorphism_ (or simply _Iso_). In the above example we can create an Isomorphism between the JSON string and the corresponding JS object using the `iso` function

```js
const json = iso(JSON.parse, JSON.stringify);
```

`iso` takes 2 functions: one to go from the source to the target, and the other to go back.

> Note this is a partial Optic since `JSON.parse` can fail. We've got another Optic (oh yeah) to account for failure

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

As I mentioned, the previous case was not a total Isomorphism because JSON strings aren't always parsed to JS objects. So, as you may expect, we need to introduce another fancy name, this time our Optic is called a `Prism`. Which is an Isomorphism that may fail when going from the source to the target (but which always succeeds when going back).

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

will simply return the original JSON string. The conversion of the `semver` Iso to a Prism is left as an exercise.

# Documentation

Using Optics follows a uniform pattern
- First we create an Optic which focuses on some value(s) inside a container
- Then we use an operation to access or modify the value through the created Optic

>In the following, all showcased functions are imported from the `focused` package
  
## Creating Optics

As seen in the tutorial,`lensProxy` offers a convenient way to create Optics which focus on javascript objects and arrays. `lensProxy` is essentially a façade API which uses explicit functions behind the scene. In the following examples, we'll see both the proxy and the coresponding explicit functions.

### Object properties

As we saw in the tutorial, we use the familiar property access notation to focus on an object property. For example

```js
const _ = lensProxy()
const nameProp = _.name
```

creates a Lens which focuses on the `name` property of an object.

Using the explicit style, we can use the the `prop` function

```js
const nameProp = prop("name")
```
As said previously, **a Lens focuses exactly on one value**, it means the value must exist in the target container (in this sense the `prop` lens is *partial*). For example, if you use `nameProp` on an object which doesn't have a `name` property, it will throw an error.

### Array elements

As with object properties, we use the array index notation to focus on an array element at a specific index. For example

```js
const _ = lensProxy()
const firstElem = _[0]
```
creates a lens that focuses on the first element on an array. The underlying function is `index`, so we could also write

```js
const firstElem = index(0)
```

`index` is also a partial Lens, meaning it will throw if given index is out of the bounds of the target array.

### Creating custom lenses

The `lens` function can be used to create arbitrary Lenses. The function takes 2 parameters

- `getter` is used to extract the focus value from the target container
- `setter` is used to update the target container with a new focus value.

In the following example, `nameProp` is equivalent to the `nameProp` Lens we saw earlier.

```js
const nameProp = lens(
  s => s.name,
  (value, s) => ({...s, name: value})
) 
```

As you may have guessed, both `prop` and `index` can be implemented using `lens`

### Composing Lenses

>Generally you can combine any 2 Optics together, even if they're of different kind (eg you can combine Lenses with Traversals)

A nice property of Lenses, and Optics in general, is that they can be combined to create a focus on deeply nested values. For example

```js
const _ = lensProxy()
const street = _.freinds[0].address.street
```

creates a Lens which focuses  on the `street` of the `address` of the first element of the `freinds` array. As a matter of comparaison, let's say we want to update, immutably, the `street` property on a given object `person`. Using JavaScript spread syntax


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

The equivalent operation in `focused` Lenses is

```js
const newPerson = set(_.freinds[0].address.street, "new street", person)
```

We're chaining `.` accesses to successively focus on deeply nested values. Behind the scene, `lensProxy` is creating the necessary `prop` and `index` Lenses, then composing them using `compose` function. Using explicit style, the above Lens could be rewritten like

```js
const streetLens = compose(
  prop("freinds"),
  index(0),
  prop("address"),
  prop("street")
);
```

The important thing to remember here, is that`lensProxy` is essentially doing the same thing in the above `compose` example. Plus some memoization tricks to ensure that Lenses are created only once and reused on subsequent operations.

## Creating Isomorphisms

Isomorphisms, or simply Isos, are useful when we want to switch between different representations of the same object. In the tutorial, we already saw `json` which create an Iso between a JSON string and the underlying object that the string parses to.

As we saw, we can use the `iso` function to create a simple Iso. It takes a couple of functions 

- the firs function is used to convert from the source representation to the target one
- the second function is used to convert back

We'll see another interesting example of Isos in the next section

## Creating Traversals

While Lenses can focus exactly on one value. Traversals has the ability to focus on many values (including `0`).

### Array Traversals

Perhaps the most familiar Traversal is `each` which focuses on all elements of an array

```js
const todos = ["each", "pray", "love"];
over(each, x => x.toUpperCase(), todos)
// ["EACH", "PRAY", "LOVE"]
```

which is essentially equivalent to the `map` operation of array. However, as we said, what sets Optics apart is their ability to compose with other Optics

```js
const todos = [
  { title: "eat", done: false },
  { title: "pray", done: false },
  { title: "love", done: false }
];
// set done to `true` for all todos
set(
  compose(each, prop("done")),
  true,
  todos
)
```

This can be more concisely formulated using the proxy interface

```js
const _ = lensProxy();
set(_.$(each).done, true, todos)
```

Note that when Traversals are composed with another Optic, the result is always a Traversal.

### Traversing Map's keys/values

Another useful example is traversing keys or values of a JavaScript `Map` object. Although the library already provides `eachMapKey` and `eachMapValue` Traversals for that purpose, it would be instructive to see how we can build them by simple composition of more primitive Optics.

First, we can observe that a `Map` object can be seen also as a collection of `[key, value]` pairs. So we can start by creating an Iso between `Map` and `Array<[key, value]>`

```js
const mapEntries = iso(
  map => [...map.entries()], 
  entries => new Map(entries)
);
```

Then from here, we can traverse keys or values by simply focusing on the appropriate index (`0` or `1`) of each pair in the returned array. 

```js
eachMapValue = compose(mapEntries, each, index(1));
eachMapKey = compose(mapEntries, each, index(0));
```

Since composition with a Traversal is also a Traversal. In the above examples, we obtain, in both cases, a Traversal that focuses on all key/values of the Map.

As an illustration, the following example use `eachMapValue` combined with the `prop("score")` lens to increase the score of each player stored in the Map. 

```js
const playerMap = new Map([
  ["Yassine", { name: "Yassine", score: 41 }], 
  ["Yahya", { name: "Yahya", score: 800 }], 
  ["Ayman", { name: "Ayman", score: 410} ]
]);
const _ = lensProxy();
over(
  _.$(eachMapValue).score, 
  x => x + 1000, 
  playerMap
);
```

### Filtered Traversals

Another useful function is `filtered`. It can be used to restrict the set of values obtained from another Traversal. The function takes 2 arguments

- A predicate used to filter traversed elements
- The Traversal to be filtered (defaults to `each`)

```js
const todos = [
  { title: "eat", done: false },
  { title: "pray", done: true },
  { title: "love", done: true }
];

const isDone = t => t.done
// view title of all done todos
toList(_.$(filtered(isDone)).title, todos);
// => ["pray", "love"]
// set done of all done todos to false
set(_.$(filtered(isDone)).done, false, todos)
```

Note that `filtered` can work with arbitrary traversals, not just arrays.

```js
const playersAbove300 = filtered(p => p.score > 300, eachMapValue)
over(
  _.$(playersAbove300).score, 
  x => x + 1000, 
  playerMap
);
```

(TBC)

## Todos
- [ ] API docs
- [x] add typings
- [ ] Indexed Traversals
