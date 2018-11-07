import test from "tape";
import {
  iso,
  maybeJson,
  view,
  over,
  toList,
  preview,
  set,
  each,
  filtered,
  json,
  lensProxy,
  anon,
  atProp,
  compose
} from "../src";

const state = {
  name: "Luffy",
  level: 4,
  nakama: [
    { name: "Zorro", level: 3 },
    { name: "Sanji", level: 3 },
    { name: "Chooper", level: 2 }
  ]
};

const _ = lensProxy();

test("view/prop", assert => {
  assert.equal(view(_.name, state), "Luffy");
  assert.end();
});

test("preview/maybeProp", assert => {
  assert.deepEqual(preview(_.$lastname.level, state), null);
  assert.end();
});

test("over/maybeProp", assert => {
  assert.deepEqual(over(_.$assitant.$level, x => x * 2, state), state);
  assert.end();
});

test("over/prop", assert => {
  assert.deepEqual(over(_.level, x => x * 2, state), {
    ...state,
    level: state.level * 2
  });
  assert.end();
});

test("view/atProp", assert => {
  assert.equal(
    view(atProp("surname"), { name: "Luffy" }),
    null,
    "should return null if property is absent"
  );

  assert.end();
});

test("view/atProp", assert => {
  assert.deepEqual(
    set(atProp("surname"), "Monkey D.", { name: "Luffy" }),
    {
      name: "Luffy",
      surname: "Monkey D."
    },
    "Should add the property if absent"
  );

  assert.deepEqual(
    set(
      compose(
        atProp("navigator"),
        atProp("name")
      ),
      "Nami",
      { name: "Luffy" }
    ),
    {
      name: "Luffy",
      navigator: { name: "Nami" }
    },
    "Should add deeply nested property if absent"
  );

  assert.end();
});

// _.at('address').at('street')
// Lens<{}, Maybe<{}>>  .  Lens<{}, Maybe<String>>

test("over/curried", assert => {
  assert.deepEqual(over(_.level)(x => x * 2, state), {
    ...state,
    level: state.level * 2
  });
  assert.deepEqual(over(_.level)(x => x * 2)(state), {
    ...state,
    level: state.level * 2
  });
  assert.deepEqual(over(_.level, x => x * 2)(state), {
    ...state,
    level: state.level * 2
  });
  assert.end();
});

test("set/curried", assert => {
  assert.deepEqual(set(_.level)(0, state), {
    ...state,
    level: 0
  });
  assert.deepEqual(set(_.level)(0)(state), {
    ...state,
    level: 0
  });
  assert.deepEqual(set(_.level, 0)(state), {
    ...state,
    level: 0
  });
  assert.end();
});

test("toList/each", assert => {
  assert.deepEqual(
    toList(_.nakama.$(each).name, state),
    state.nakama.map(n => n.name)
  );
  assert.end();
});

test("toList/filtered", assert => {
  assert.deepEqual(
    toList(_.nakama.$(filtered(x => x.level > 2)).name, state),
    state.nakama.filter(n => n.level > 2).map(n => n.name)
  );
  assert.end();
});

test("over/filtered", assert => {
  assert.deepEqual(
    over(_.nakama.$(filtered(x => x.level > 2)).name, s => `**${s}**`, state),
    {
      ...state,
      nakama: state.nakama.map(
        n => (n.level > 2 ? { ...n, name: `**${n.name}**` } : n)
      )
    }
  );
  assert.end();
});

test("set/[0]", assert => {
  assert.deepEqual(set(_.nakama[0].name, "Jimbi", state), {
    ...state,
    nakama: state.nakama.map((n, i) => (i === 0 ? { ...n, name: "Jimbi" } : n))
  });
  assert.end();
});

test("iso/anon", assert => {
  // nonZero is an Iso from Maybe<negative number> to number (with 1 as default value)
  // source is either null or a negative number
  // target is any number
  const negative = anon(0, x => x >= 0);
  assert.equal(view(negative, -10), -10);
  assert.equal(view(negative, null), 0);

  assert.equal(
    set(negative, -3, -10),
    -3,
    "should allow setting to negative numbers"
  );
  assert.equal(
    set(negative, -3, null),
    -3,
    "should allow setting on null values"
  );
  assert.equal(
    set(negative, 10, -3),
    null,
    "should not allow setting non-negative numbers"
  );
  assert.end();
});

const jsonObj = `{
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

const semver = iso(
  s => {
    const [major, minor, patch] = s.split(".").map(x => +x);
    return { major, minor, patch };
  },
  ({ major, minor, patch }) => [major, minor, patch].join(".")
);

test("over/iso", assert => {
  const actualJSON = over(
    _.$(json).dependencies.mydep.$(semver).minor,
    x => x + 1,
    jsonObj
  );
  const js = JSON.parse(jsonObj);
  js.dependencies.mydep = "6.1.0";

  assert.deepEqual(JSON.parse(actualJSON), js);
  assert.end();
});

test("over/prism", assert => {
  const badJSonObj = "@#" + jsonObj;

  assert.equal(
    set(_.$(maybeJson).dependencies.mydep, "6.1.0", badJSonObj),
    badJSonObj
  );
  assert.end();
});
