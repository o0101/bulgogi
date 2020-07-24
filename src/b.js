const parser = new DOMParser();

const consistentFocus = imperfectlySaveAndRestoreFocus();

export function toDOM(markup) {
  return parser.parseFromString(markup, 'text/html');
}

export async function update(view, state, {useBody: useBody = false} = {}) {
  consistentFocus.next();
  
  const doc = toDOM(await view(state));

  if ( useBody ) {
    document.body.replaceWith(doc.body);
  } else {
    document.documentElement.replaceWith(doc.documentElement);
  }

  consistentFocus.next();
}

// state merging export
  export function merge(state, newStateFlat) {
    // Notes
      // normally if we use Object.assign(state, newState), then
      // nested properties not specified in newState will be overwritten
      // so merge does a proper deep merge 
      // but it does it an easy way by requiring all nested property chains 
      // are already converted to flat strings
      // like prop1.prop2.prop3
    [...Object.entries(newStateFlat)].forEach(([key, value]) => {
      const path = key.split('.');
      const lastStep = path.pop();
      let root = state;
      for( const step of path ) {
        if ( ! root[step] ) {
          // fill in gaps
          root = {};
        } else {
          root = root[step];
        }
      }
      root[lastStep] = value;
    });
  }

// utility exports
  export function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

// rendering helpers
// imperfect focus restoring helpers
	// we need helpers to keep focus where it was before the last render
	function *imperfectlySaveAndRestoreFocus() {
		// we use a generator to track focus because 
		// generators make it easy to keep track of 
		// state over a repetitve asynchronous process

		while(true) {
			const active = document.activeElement;
			let selectionStart,selectionEnd,value;

			if ( active && (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) ) {
				({selectionStart,selectionEnd,value} = active);
			}

			yield;

			// we don't want to preserve focus across route changes
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
