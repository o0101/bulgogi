# bulgogi

Non-framework render function

## In its entirety

```javascript
const parser = new DOMParser();

const consistentFocus = imperfectlySaveAndRestoreFocus();

function toDOM(markup) {
  return parser.parseFromString(markup, 'text/html');
}

export function update(view, state) {
  consistentFocus.next();
  
  const docEl = toDOM(view(state)).documentElement;
  document.documentElement.replaceWith(docEl);

  consistentFocus.next();
}

function *imperfectlySaveAndRestoreFocus() {
  while(true) {
    const active = document.activeElement;
    let selectionStart,selectionEnd;
    if ( active ) {
      ({selectionStart,selectionEnd} = active);
    }

    yield;

    if ( active ) {
      const newActive = document.querySelector(imperfectlyGetSelector(active));
      if ( newActive ) {
        newActive.focus();
        try {
          Object.assign(newActive,{selectionStart,selectionEnd});
        } catch(e) {}
      }
    }

    yield;
  }
}

function imperfectlyGetSelector(el) {
  // the first html to our selector does not help specificity
  return `${
    el.parentElement && el.parentElement.localName != 'html' ? `${imperfectlyGetSelector(el.parentElement)} > ` : ''  
  }${
    el.localName
  }${
    el.id ? `#${el.id.replace(/\./g, '\\\\.')}` : ''
  }${
    el.classList.length ? `.${[...el.classList].join('.')}` : ''
  }${
    el.name ? `[name="${el.name}"]` : ''
  }`;
}
```


## Docs `update(view, state)` via example

```javascript
import {update} from './b.js';

let counter = 0;

runTest();
setInterval(runTest, 2000);

function runTest() {
  update(Test, {counter:counter++});
}

function Test(state) {
  return `
    <article class=excellent>
      <h1>An Article Title</h1>
      ${Test2(state)}
    </article>
  `
}

function Test2({counter}) {
  return `
    <form method=GET action=/hello>
      <input type=number name=xchakka value=${counter}>
      <input type=text name=bigloo value=${counter}>
      <button onclick=runFormTest(this,event,onclick,name,xchakka);>Do it</button>
    </form>
  `;
}

function runFormTest(...a) { 
  return (console.log(...a), a[1].preventDefault(), false) 
}; 

self.runFormTest = runFormTest;
```

## Benefits

- not a framework, just 1 function from a file with < 90 SLOC. 
- write HTML with templates
- use inline (HTML attribute) event handlers functions
- use format `oneventname=myHandler(<...my args>)` instead of `oneventname=<...my code>` because you can inject special variables from the attribute handler scope as parameters to your function without having them pollute the scope of your function`
  - benefits include useful variables available in scope of the attribute value like:
    - event: the Event that fired
    - this: the event target the handler is attached to
    - `<elprop>`: the property named by `elprop` of the element its attached to, overrides
    - `<name>`: the form control named by `name` of any `form` ancestor, overrides
    - `<docprop>`: the property named by `docprop` of any document ancestor
  - details about which elements are reflected to the document or window, [here](https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Event_handlers) and [here](https://html.spec.whatwg.org/multipage/webappapis.html#event-handlers-on-elements,-document-objects,-and-window-objects)
  

