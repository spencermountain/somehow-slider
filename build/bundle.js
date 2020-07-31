
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
	'use strict';

	function noop() {}

	function add_location(element, file, line, column, char) {
		element.__svelte_meta = {
			loc: { file, line, column, char }
		};
	}

	function run(fn) {
		return fn();
	}

	function blank_object() {
		return Object.create(null);
	}

	function run_all(fns) {
		fns.forEach(run);
	}

	function is_function(thing) {
		return typeof thing === 'function';
	}

	function safe_not_equal(a, b) {
		return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
	}

	function append(target, node) {
		target.appendChild(node);
	}

	function insert(target, node, anchor) {
		target.insertBefore(node, anchor);
	}

	function detach(node) {
		node.parentNode.removeChild(node);
	}

	function element(name) {
		return document.createElement(name);
	}

	function text(data) {
		return document.createTextNode(data);
	}

	function space() {
		return text(' ');
	}

	function listen(node, event, handler, options) {
		node.addEventListener(event, handler, options);
		return () => node.removeEventListener(event, handler, options);
	}

	function attr(node, attribute, value) {
		if (value == null) node.removeAttribute(attribute);
		else node.setAttribute(attribute, value);
	}

	function children(element) {
		return Array.from(element.childNodes);
	}

	function set_data(text, data) {
		data = '' + data;
		if (text.data !== data) text.data = data;
	}

	function set_style(node, key, value) {
		node.style.setProperty(key, value);
	}

	let current_component;

	function set_current_component(component) {
		current_component = component;
	}

	const dirty_components = [];

	let update_promise;
	const binding_callbacks = [];
	const render_callbacks = [];
	const flush_callbacks = [];

	function schedule_update() {
		if (!update_promise) {
			update_promise = Promise.resolve();
			update_promise.then(flush);
		}
	}

	function add_binding_callback(fn) {
		binding_callbacks.push(fn);
	}

	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	function add_flush_callback(fn) {
		flush_callbacks.push(fn);
	}

	function flush() {
		const seen_callbacks = new Set();

		do {
			// first, call beforeUpdate functions
			// and update components
			while (dirty_components.length) {
				const component = dirty_components.shift();
				set_current_component(component);
				update(component.$$);
			}

			while (binding_callbacks.length) binding_callbacks.shift()();

			// then, once components are updated, call
			// afterUpdate functions. This may cause
			// subsequent updates...
			while (render_callbacks.length) {
				const callback = render_callbacks.pop();
				if (!seen_callbacks.has(callback)) {
					callback();

					// ...so guard against infinite loops
					seen_callbacks.add(callback);
				}
			}
		} while (dirty_components.length);

		while (flush_callbacks.length) {
			flush_callbacks.pop()();
		}

		update_promise = null;
	}

	function update($$) {
		if ($$.fragment) {
			$$.update($$.dirty);
			run_all($$.before_render);
			$$.fragment.p($$.dirty, $$.ctx);
			$$.dirty = null;

			$$.after_render.forEach(add_render_callback);
		}
	}

	function bind(component, name, callback) {
		if (component.$$.props.indexOf(name) === -1) return;
		component.$$.bound[name] = callback;
		callback(component.$$.ctx[name]);
	}

	function mount_component(component, target, anchor) {
		const { fragment, on_mount, on_destroy, after_render } = component.$$;

		fragment.m(target, anchor);

		// onMount happens after the initial afterUpdate. Because
		// afterUpdate callbacks happen in reverse order (inner first)
		// we schedule onMount callbacks before afterUpdate callbacks
		add_render_callback(() => {
			const new_on_destroy = on_mount.map(run).filter(is_function);
			if (on_destroy) {
				on_destroy.push(...new_on_destroy);
			} else {
				// Edge case - component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});

		after_render.forEach(add_render_callback);
	}

	function destroy(component, detaching) {
		if (component.$$) {
			run_all(component.$$.on_destroy);
			component.$$.fragment.d(detaching);

			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			component.$$.on_destroy = component.$$.fragment = null;
			component.$$.ctx = {};
		}
	}

	function make_dirty(component, key) {
		if (!component.$$.dirty) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty = {};
		}
		component.$$.dirty[key] = true;
	}

	function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
		const parent_component = current_component;
		set_current_component(component);

		const props = options.props || {};

		const $$ = component.$$ = {
			fragment: null,
			ctx: null,

			// state
			props: prop_names,
			update: noop,
			not_equal: not_equal$$1,
			bound: blank_object(),

			// lifecycle
			on_mount: [],
			on_destroy: [],
			before_render: [],
			after_render: [],
			context: new Map(parent_component ? parent_component.$$.context : []),

			// everything else
			callbacks: blank_object(),
			dirty: null
		};

		let ready = false;

		$$.ctx = instance
			? instance(component, props, (key, value) => {
				if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
					if ($$.bound[key]) $$.bound[key](value);
					if (ready) make_dirty(component, key);
				}
			})
			: props;

		$$.update();
		ready = true;
		run_all($$.before_render);
		$$.fragment = create_fragment($$.ctx);

		if (options.target) {
			if (options.hydrate) {
				$$.fragment.l(children(options.target));
			} else {
				$$.fragment.c();
			}

			if (options.intro && component.$$.fragment.i) component.$$.fragment.i();
			mount_component(component, options.target, options.anchor);
			flush();
		}

		set_current_component(parent_component);
	}

	class SvelteComponent {
		$destroy() {
			destroy(this, true);
			this.$destroy = noop;
		}

		$on(type, callback) {
			const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
			callbacks.push(callback);

			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		$set() {
			// overridden by instance, if it has props
		}
	}

	class SvelteComponentDev extends SvelteComponent {
		constructor(options) {
			if (!options || (!options.target && !options.$$inline)) {
				throw new Error(`'target' is a required option`);
			}

			super();
		}

		$destroy() {
			super.$destroy();
			this.$destroy = () => {
				console.warn(`Component was already destroyed`); // eslint-disable-line no-console
			};
		}
	}

	const scaleLinear = function (obj) {
	  let world = obj.world || [];
	  let minmax = obj.minmax || [];
	  const calc = (num) => {
	    let range = minmax[1] - minmax[0];
	    let percent = (num - minmax[0]) / range;
	    let size = world[1] - world[0];
	    let res = size * percent;
	    if (res > minmax.max) {
	      return minmax.max
	    }
	    if (res < minmax.min) {
	      return minmax.min
	    }
	    return res
	  };
	  // invert the calculation. return a %?
	  calc.backward = (num) => {
	    let size = world[1] - world[0];
	    let range = minmax[1] - minmax[0];
	    let percent = (num - world[0]) / size;
	    return percent * range
	  };
	  return calc
	};

	/* src/Vertical/Vertical.svelte generated by Svelte v3.0.0 */

	const file = "src/Vertical/Vertical.svelte";

	function create_fragment(ctx) {
		var div3, div0, t0, div2, div1, t1_value = Math.round(ctx.value), t1, dispose;

		return {
			c: function create() {
				div3 = element("div");
				div0 = element("div");
				t0 = space();
				div2 = element("div");
				div1 = element("div");
				t1 = text(t1_value);
				div0.className = "background svelte-9cy2tw";
				add_location(div0, file, 101, 2, 2208);
				div1.className = "number svelte-9cy2tw";
				add_location(div1, file, 107, 4, 2345);
				div2.className = "handle svelte-9cy2tw";
				set_style(div2, "top", "" + ctx.percent + "%");
				add_location(div2, file, 102, 2, 2237);
				div3.className = "container svelte-9cy2tw";
				div3.tabIndex = "0";
				add_location(div3, file, 96, 0, 2106);

				dispose = [
					listen(div2, "pointerdown", ctx.startClick),
					listen(div3, "pointerdown", ctx.startClick),
					listen(div3, "keydown", ctx.handleKeydown)
				];
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div3, anchor);
				append(div3, div0);
				append(div3, t0);
				append(div3, div2);
				append(div2, div1);
				append(div1, t1);
				add_binding_callback(() => ctx.div2_binding(div2, null));
			},

			p: function update(changed, ctx) {
				if ((changed.value) && t1_value !== (t1_value = Math.round(ctx.value))) {
					set_data(t1, t1_value);
				}

				if (changed.items) {
					ctx.div2_binding(null, div2);
					ctx.div2_binding(div2, null);
				}

				if (changed.percent) {
					set_style(div2, "top", "" + ctx.percent + "%");
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(div3);
				}

				ctx.div2_binding(null, div2);
				run_all(dispose);
			}
		};
	}

	function instance($$self, $$props, $$invalidate) {
		let { value = 0, max = 100, min = 0 } = $$props;
	  let scale = scaleLinear({ world: [0, 100], minmax: [min, max] });
	  let percent = scale(value);
	  let dragStart = 0;
	  let el = null;
	  // let status = 'init'

	  const moveHandle = function(e) {
	    console.log(e.target);
	    if (el.isSameNode(e.target) === true) {
	      return
	    }
	    let total = e.target.clientHeight;
	    let val = e.layerY || 0;

	    $$invalidate('percent', percent = (val / total) * 100);
	    if (percent > 100) {
	      $$invalidate('percent', percent = 100);
	    }
	    if (percent < 0) {
	      $$invalidate('percent', percent = 0);
	    }
	    $$invalidate('value', value = scale.backward(percent));
	  };
	  // end drag event
	  const mouseUp = function(e) {
	    stopDrag();
	  };
	  const didDrag = function(e) {
	    moveHandle(e);
	  };
	  const stopDrag = function(e) {
	    window.removeEventListener('pointermove', didDrag);
	    window.removeEventListener('pointerup', mouseUp);
	  };
	  function startClick(e) {
	    $$invalidate('dragStart', dragStart = e.layerY);
	    window.addEventListener('pointermove', didDrag);
	    window.addEventListener('pointerup', mouseUp);
	    moveHandle(e);
	  }
	  function handleKeydown(event) {
	    if (event.key === 'ArrowUp') {
	      $$invalidate('percent', percent -= 1);
	      $$invalidate('value', value = scale.backward(percent));
	    }
	    if (event.key === 'ArrowDown') {
	      $$invalidate('percent', percent += 1);
	      $$invalidate('value', value = scale.backward(percent));
	    }
	  }

		function div2_binding($$node, check) {
			el = $$node;
			$$invalidate('el', el);
		}

		$$self.$set = $$props => {
			if ('value' in $$props) $$invalidate('value', value = $$props.value);
			if ('max' in $$props) $$invalidate('max', max = $$props.max);
			if ('min' in $$props) $$invalidate('min', min = $$props.min);
		};

		return {
			value,
			max,
			min,
			percent,
			el,
			startClick,
			handleKeydown,
			div2_binding
		};
	}

	class Vertical extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance, create_fragment, safe_not_equal, ["value", "max", "min"]);

			const { ctx } = this.$$;
			const props = options.props || {};
			if (ctx.value === undefined && !('value' in props)) {
				console.warn("<Vertical> was created without expected prop 'value'");
			}
			if (ctx.max === undefined && !('max' in props)) {
				console.warn("<Vertical> was created without expected prop 'max'");
			}
			if (ctx.min === undefined && !('min' in props)) {
				console.warn("<Vertical> was created without expected prop 'min'");
			}
		}

		get value() {
			throw new Error("<Vertical>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set value(value) {
			throw new Error("<Vertical>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get max() {
			throw new Error("<Vertical>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set max(value) {
			throw new Error("<Vertical>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get min() {
			throw new Error("<Vertical>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set min(value) {
			throw new Error("<Vertical>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* Demo.svelte generated by Svelte v3.0.0 */

	const file$1 = "Demo.svelte";

	// (42:4) <Vertical bind:value min={0} max={200}>
	function create_default_slot(ctx) {
		var label0, t0, label1, t1, label2;

		return {
			c: function create() {
				label0 = element("label");
				t0 = space();
				label1 = element("label");
				t1 = space();
				label2 = element("label");
				attr(label0, "start", "10");
				attr(label0, "end", "20");
				attr(label0, "color", "red");
				attr(label0, "label", "beginning");
				add_location(label0, file$1, 42, 6, 1035);
				attr(label1, "start", "20");
				attr(label1, "end", "180");
				attr(label1, "color", "blue");
				attr(label1, "label", "middle");
				add_location(label1, file$1, 43, 6, 1101);
				attr(label2, "start", "180");
				attr(label2, "end", "190");
				attr(label2, "color", "red");
				attr(label2, "label", "end");
				add_location(label2, file$1, 44, 6, 1166);
			},

			m: function mount(target, anchor) {
				insert(target, label0, anchor);
				insert(target, t0, anchor);
				insert(target, label1, anchor);
				insert(target, t1, anchor);
				insert(target, label2, anchor);
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(label0);
					detach(t0);
					detach(label1);
					detach(t1);
					detach(label2);
				}
			}
		};
	}

	function create_fragment$1(ctx) {
		var div6, div0, a, t1, div1, t3, h20, t5, div2, t6, div3, t7, h21, t9, div4, updating_value, t10, div5, current;

		function vertical_value_binding(value_1) {
			ctx.vertical_value_binding.call(null, value_1);
			updating_value = true;
			add_flush_callback(() => updating_value = false);
		}

		let vertical_props = {
			min: 0,
			max: 200,
			$$slots: { default: [create_default_slot] },
			$$scope: { ctx }
		};
		if (ctx.value !== void 0) {
			vertical_props.value = ctx.value;
		}
		var vertical = new Vertical({ props: vertical_props, $$inline: true });

		add_binding_callback(() => bind(vertical, 'value', vertical_value_binding));

		return {
			c: function create() {
				div6 = element("div");
				div0 = element("div");
				a = element("a");
				a.textContent = "somehow-slider";
				t1 = space();
				div1 = element("div");
				div1.textContent = "some handy svelte slider (aka range) components";
				t3 = space();
				h20 = element("h2");
				h20.textContent = "Horizontal:";
				t5 = space();
				div2 = element("div");
				t6 = space();
				div3 = element("div");
				t7 = space();
				h21 = element("h2");
				h21.textContent = "Vertical:";
				t9 = space();
				div4 = element("div");
				vertical.$$.fragment.c();
				t10 = space();
				div5 = element("div");
				a.href = "https://github.com/spencermountain/somehow-slider";
				add_location(a, file$1, 23, 4, 389);
				add_location(div0, file$1, 22, 2, 379);
				add_location(div1, file$1, 27, 2, 491);
				h20.className = "mt3 svelte-iy82y4";
				add_location(h20, file$1, 29, 2, 553);
				set_style(div2, "width", "80%");
				add_location(div2, file$1, 30, 2, 588);
				div3.className = "mt3 svelte-iy82y4";
				add_location(div3, file$1, 37, 2, 890);
				h21.className = "mt3 svelte-iy82y4";
				add_location(h21, file$1, 39, 2, 913);
				set_style(div4, "width", "80%");
				set_style(div4, "height", "300px");
				add_location(div4, file$1, 40, 2, 946);
				div5.className = "mt3 svelte-iy82y4";
				add_location(div5, file$1, 47, 2, 1249);
				div6.className = "col svelte-iy82y4";
				add_location(div6, file$1, 21, 0, 359);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div6, anchor);
				append(div6, div0);
				append(div0, a);
				append(div6, t1);
				append(div6, div1);
				append(div6, t3);
				append(div6, h20);
				append(div6, t5);
				append(div6, div2);
				append(div6, t6);
				append(div6, div3);
				append(div6, t7);
				append(div6, h21);
				append(div6, t9);
				append(div6, div4);
				mount_component(vertical, div4, null);
				append(div6, t10);
				append(div6, div5);
				current = true;
			},

			p: function update(changed, ctx) {
				var vertical_changes = {};
				if (changed.$$scope) vertical_changes.$$scope = { changed, ctx };
				if (!updating_value && changed.value) {
					vertical_changes.value = ctx.value;
				}
				vertical.$set(vertical_changes);
			},

			i: function intro(local) {
				if (current) return;
				vertical.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				vertical.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div6);
				}

				vertical.$destroy();
			}
		};
	}

	function instance$1($$self, $$props, $$invalidate) {
		let value = 20;

		function vertical_value_binding(value_1) {
			value = value_1;
			$$invalidate('value', value);
		}

		return { value, vertical_value_binding };
	}

	class Demo extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$1, create_fragment$1, safe_not_equal, []);
		}
	}

	const app = new Demo({
	  target: document.body,
	});

	return app;

}());
