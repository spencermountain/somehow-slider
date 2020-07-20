
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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
        target.insertBefore(node, anchor || null);
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
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
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
        $capture_state() { }
        $inject_state() { }
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

    /* src/Horizontal/Horizontal.svelte generated by Svelte v3.24.0 */
    const file = "src/Horizontal/Horizontal.svelte";

    function create_fragment(ctx) {
    	let div3;
    	let div0;
    	let t0;
    	let div2;
    	let div1;
    	let t1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			t1 = text(/*value*/ ctx[0]);
    			attr_dev(div0, "class", "background svelte-my6qah");
    			add_location(div0, file, 80, 2, 1794);
    			add_location(div1, file, 86, 4, 1932);
    			attr_dev(div2, "class", "handle svelte-my6qah");
    			set_style(div2, "left", /*percent*/ ctx[1] + "%");
    			add_location(div2, file, 81, 2, 1823);
    			attr_dev(div3, "class", "container svelte-my6qah");
    			add_location(div3, file, 79, 0, 1740);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, t1);
    			/*div2_binding*/ ctx[6](div2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div2, "pointerdown", /*startClick*/ ctx[3], false, false, false),
    					listen_dev(div3, "pointerdown", /*startClick*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*value*/ 1) set_data_dev(t1, /*value*/ ctx[0]);

    			if (dirty & /*percent*/ 2) {
    				set_style(div2, "left", /*percent*/ ctx[1] + "%");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			/*div2_binding*/ ctx[6](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { value = 0 } = $$props;
    	let { max = 100 } = $$props;
    	let { min = 0 } = $$props;
    	let scale = scaleLinear({ world: [0, 100], minmax: [min, max] });
    	let percent = scale(value);
    	let dragStart = 0;
    	let el = null;

    	// let status = 'init'
    	const moveHandle = function (e) {
    		if (el.isSameNode(e.target) === true) {
    			return;
    		}

    		let total = e.target.clientWidth;
    		let val = e.layerX || 0;
    		$$invalidate(1, percent = val / total * 100);

    		if (percent > 100) {
    			$$invalidate(1, percent = 100);
    		}

    		if (percent < 0) {
    			$$invalidate(1, percent = 0);
    		}

    		$$invalidate(0, value = scale.backward(percent));
    	};

    	// end drag event
    	const mouseUp = function (e) {
    		stopDrag();
    	};

    	const didDrag = function (e) {
    		moveHandle(e);
    	};

    	const stopDrag = function (e) {
    		window.removeEventListener("pointermove", didDrag);
    		window.removeEventListener("pointerup", mouseUp);
    	};

    	function startClick(e) {
    		dragStart = e.layerX;
    		window.addEventListener("pointermove", didDrag);
    		window.addEventListener("pointerup", mouseUp);
    		moveHandle(e);
    	}

    	const writable_props = ["value", "max", "min"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Horizontal> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Horizontal", $$slots, []);

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			el = $$value;
    			$$invalidate(2, el);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("max" in $$props) $$invalidate(4, max = $$props.max);
    		if ("min" in $$props) $$invalidate(5, min = $$props.min);
    	};

    	$$self.$capture_state = () => ({
    		scaleLinear,
    		value,
    		max,
    		min,
    		scale,
    		percent,
    		dragStart,
    		el,
    		moveHandle,
    		mouseUp,
    		didDrag,
    		stopDrag,
    		startClick
    	});

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("max" in $$props) $$invalidate(4, max = $$props.max);
    		if ("min" in $$props) $$invalidate(5, min = $$props.min);
    		if ("scale" in $$props) scale = $$props.scale;
    		if ("percent" in $$props) $$invalidate(1, percent = $$props.percent);
    		if ("dragStart" in $$props) dragStart = $$props.dragStart;
    		if ("el" in $$props) $$invalidate(2, el = $$props.el);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, percent, el, startClick, max, min, div2_binding];
    }

    class Horizontal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { value: 0, max: 4, min: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Horizontal",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get value() {
    		throw new Error("<Horizontal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Horizontal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get max() {
    		throw new Error("<Horizontal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max(value) {
    		throw new Error("<Horizontal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get min() {
    		throw new Error("<Horizontal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set min(value) {
    		throw new Error("<Horizontal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Label.svelte generated by Svelte v3.24.0 */

    const file$1 = "src/Label.svelte";

    function create_fragment$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			add_location(div, file$1, 10, 0, 108);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { label = "" } = $$props;
    	let { start = 0 } = $$props;
    	let { end = 10 } = $$props;
    	const writable_props = ["label", "start", "end"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Label> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Label", $$slots, []);

    	$$self.$set = $$props => {
    		if ("label" in $$props) $$invalidate(0, label = $$props.label);
    		if ("start" in $$props) $$invalidate(1, start = $$props.start);
    		if ("end" in $$props) $$invalidate(2, end = $$props.end);
    	};

    	$$self.$capture_state = () => ({ label, start, end });

    	$$self.$inject_state = $$props => {
    		if ("label" in $$props) $$invalidate(0, label = $$props.label);
    		if ("start" in $$props) $$invalidate(1, start = $$props.start);
    		if ("end" in $$props) $$invalidate(2, end = $$props.end);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [label, start, end];
    }

    class Label extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { label: 0, start: 1, end: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Label",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get label() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get start() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set start(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get end() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set end(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* Demo.svelte generated by Svelte v3.24.0 */
    const file$2 = "Demo.svelte";

    // (32:4) <Horizontal bind:value min={0} max={200}>
    function create_default_slot_1(ctx) {
    	let label0;
    	let t0;
    	let label1;
    	let t1;
    	let label2;

    	const block = {
    		c: function create() {
    			label0 = element("label");
    			t0 = space();
    			label1 = element("label");
    			t1 = space();
    			label2 = element("label");
    			attr_dev(label0, "start", "10");
    			attr_dev(label0, "end", "20");
    			attr_dev(label0, "color", "red");
    			attr_dev(label0, "label", "beginning");
    			add_location(label0, file$2, 32, 6, 655);
    			attr_dev(label1, "start", "20");
    			attr_dev(label1, "end", "180");
    			attr_dev(label1, "color", "blue");
    			attr_dev(label1, "label", "middle");
    			add_location(label1, file$2, 33, 6, 721);
    			attr_dev(label2, "start", "180");
    			attr_dev(label2, "end", "190");
    			attr_dev(label2, "color", "red");
    			attr_dev(label2, "label", "end");
    			add_location(label2, file$2, 34, 6, 786);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, label1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, label2, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(label1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(label2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(32:4) <Horizontal bind:value min={0} max={200}>",
    		ctx
    	});

    	return block;
    }

    // (42:4) <Horizontal bind:value min={0} max={200}>
    function create_default_slot(ctx) {
    	let label0;
    	let t0;
    	let label1;
    	let t1;
    	let label2;

    	const block = {
    		c: function create() {
    			label0 = element("label");
    			t0 = space();
    			label1 = element("label");
    			t1 = space();
    			label2 = element("label");
    			attr_dev(label0, "start", "10");
    			attr_dev(label0, "end", "20");
    			attr_dev(label0, "color", "red");
    			attr_dev(label0, "label", "beginning");
    			add_location(label0, file$2, 42, 6, 1004);
    			attr_dev(label1, "start", "20");
    			attr_dev(label1, "end", "180");
    			attr_dev(label1, "color", "blue");
    			attr_dev(label1, "label", "middle");
    			add_location(label1, file$2, 43, 6, 1070);
    			attr_dev(label2, "start", "180");
    			attr_dev(label2, "end", "190");
    			attr_dev(label2, "color", "red");
    			attr_dev(label2, "label", "end");
    			add_location(label2, file$2, 44, 6, 1135);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, label1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, label2, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(label1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(label2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(42:4) <Horizontal bind:value min={0} max={200}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div6;
    	let div0;
    	let a;
    	let t1;
    	let div1;
    	let t3;
    	let h20;
    	let t5;
    	let div2;
    	let horizontal0;
    	let updating_value;
    	let t6;
    	let div3;
    	let t7;
    	let h21;
    	let t9;
    	let div4;
    	let horizontal1;
    	let updating_value_1;
    	let t10;
    	let div5;
    	let current;

    	function horizontal0_value_binding(value) {
    		/*horizontal0_value_binding*/ ctx[1].call(null, value);
    	}

    	let horizontal0_props = {
    		min: 0,
    		max: 200,
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	};

    	if (/*value*/ ctx[0] !== void 0) {
    		horizontal0_props.value = /*value*/ ctx[0];
    	}

    	horizontal0 = new Horizontal({ props: horizontal0_props, $$inline: true });
    	binding_callbacks.push(() => bind(horizontal0, "value", horizontal0_value_binding));

    	function horizontal1_value_binding(value) {
    		/*horizontal1_value_binding*/ ctx[2].call(null, value);
    	}

    	let horizontal1_props = {
    		min: 0,
    		max: 200,
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	};

    	if (/*value*/ ctx[0] !== void 0) {
    		horizontal1_props.value = /*value*/ ctx[0];
    	}

    	horizontal1 = new Horizontal({ props: horizontal1_props, $$inline: true });
    	binding_callbacks.push(() => bind(horizontal1, "value", horizontal1_value_binding));

    	const block = {
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
    			create_component(horizontal0.$$.fragment);
    			t6 = space();
    			div3 = element("div");
    			t7 = space();
    			h21 = element("h2");
    			h21.textContent = "Vertical:";
    			t9 = space();
    			div4 = element("div");
    			create_component(horizontal1.$$.fragment);
    			t10 = space();
    			div5 = element("div");
    			attr_dev(a, "href", "https://github.com/spencermountain/somehow-slider");
    			add_location(a, file$2, 23, 4, 379);
    			add_location(div0, file$2, 22, 2, 369);
    			add_location(div1, file$2, 27, 2, 481);
    			attr_dev(h20, "class", "mt3 svelte-iy82y4");
    			add_location(h20, file$2, 29, 2, 543);
    			set_style(div2, "width", "80%");
    			add_location(div2, file$2, 30, 2, 578);
    			attr_dev(div3, "class", "mt3 svelte-iy82y4");
    			add_location(div3, file$2, 37, 2, 871);
    			attr_dev(h21, "class", "mt3 svelte-iy82y4");
    			add_location(h21, file$2, 39, 2, 894);
    			set_style(div4, "width", "80%");
    			add_location(div4, file$2, 40, 2, 927);
    			attr_dev(div5, "class", "mt3 svelte-iy82y4");
    			add_location(div5, file$2, 47, 2, 1220);
    			attr_dev(div6, "class", "col svelte-iy82y4");
    			add_location(div6, file$2, 21, 0, 349);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div0);
    			append_dev(div0, a);
    			append_dev(div6, t1);
    			append_dev(div6, div1);
    			append_dev(div6, t3);
    			append_dev(div6, h20);
    			append_dev(div6, t5);
    			append_dev(div6, div2);
    			mount_component(horizontal0, div2, null);
    			append_dev(div6, t6);
    			append_dev(div6, div3);
    			append_dev(div6, t7);
    			append_dev(div6, h21);
    			append_dev(div6, t9);
    			append_dev(div6, div4);
    			mount_component(horizontal1, div4, null);
    			append_dev(div6, t10);
    			append_dev(div6, div5);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const horizontal0_changes = {};

    			if (dirty & /*$$scope*/ 8) {
    				horizontal0_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_value && dirty & /*value*/ 1) {
    				updating_value = true;
    				horizontal0_changes.value = /*value*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			horizontal0.$set(horizontal0_changes);
    			const horizontal1_changes = {};

    			if (dirty & /*$$scope*/ 8) {
    				horizontal1_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_value_1 && dirty & /*value*/ 1) {
    				updating_value_1 = true;
    				horizontal1_changes.value = /*value*/ ctx[0];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			horizontal1.$set(horizontal1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(horizontal0.$$.fragment, local);
    			transition_in(horizontal1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(horizontal0.$$.fragment, local);
    			transition_out(horizontal1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			destroy_component(horizontal0);
    			destroy_component(horizontal1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let value = 20;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Demo> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Demo", $$slots, []);

    	function horizontal0_value_binding(value$1) {
    		value = value$1;
    		$$invalidate(0, value);
    	}

    	function horizontal1_value_binding(value$1) {
    		value = value$1;
    		$$invalidate(0, value);
    	}

    	$$self.$capture_state = () => ({ Horizontal, Label, value });

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, horizontal0_value_binding, horizontal1_value_binding];
    }

    class Demo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Demo",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const app = new Demo({
      target: document.body,
    });

    return app;

}());
