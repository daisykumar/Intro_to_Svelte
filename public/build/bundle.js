
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
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.22.2' }, detail)));
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
        if (text.data === data)
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

    /* src/Circle.svelte generated by Svelte v3.22.2 */

    const file = "src/Circle.svelte";

    function create_fragment(ctx) {
    	let main;
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			t = text(/*text*/ ctx[0]);
    			attr_dev(div, "class", "svelte-ilgkee");
    			add_location(div, file, 7, 0, 144);
    			attr_dev(main, "class", "svelte-ilgkee");
    			add_location(main, file, 6, 0, 137);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*text*/ 1) set_data_dev(t, /*text*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
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
    	let { text = "Fun Fun Fun" } = $$props;
    	const writable_props = ["text"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Circle> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Circle", $$slots, []);

    	$$self.$set = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    	};

    	$$self.$capture_state = () => ({ text });

    	$$self.$inject_state = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [text];
    }

    class Circle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { text: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Circle",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get text() {
    		throw new Error("<Circle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Circle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Butterfly.svelte generated by Svelte v3.22.2 */

    const file$1 = "src/Butterfly.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			main = element("main");
    			img = element("img");
    			attr_dev(img, "alt", "butterfly");
    			if (img.src !== (img_src_value = "https://www.healtheuropa.eu/wp-content/uploads/2019/12/iStock-604372128.jpg")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$1, 1, 4, 11);
    			add_location(main, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, img);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
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

    function instance$1($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Butterfly> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Butterfly", $$slots, []);
    	return [];
    }

    class Butterfly extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Butterfly",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/Square.svelte generated by Svelte v3.22.2 */

    const file$2 = "src/Square.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let div;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			attr_dev(div, "class", "square svelte-o058p0");
    			set_style(div, "background-color", /*color*/ ctx[0]);
    			add_location(div, file$2, 4, 4, 67);
    			attr_dev(main, "class", "svelte-o058p0");
    			add_location(main, file$2, 3, 0, 56);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*color*/ 1) {
    				set_style(div, "background-color", /*color*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
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
    	let { color = "blueviolet" } = $$props;
    	const writable_props = ["color"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Square> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Square", $$slots, []);

    	$$self.$set = $$props => {
    		if ("color" in $$props) $$invalidate(0, color = $$props.color);
    	};

    	$$self.$capture_state = () => ({ color });

    	$$self.$inject_state = $$props => {
    		if ("color" in $$props) $$invalidate(0, color = $$props.color);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color];
    }

    class Square extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { color: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Square",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get color() {
    		throw new Error("<Square>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Square>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.22.2 */

    const file$3 = "src/App.svelte";

    // (37:1) {:else}
    function create_else_block(ctx) {
    	let button;
    	let t1;
    	let current;
    	let dispose;
    	const square = new Square({ $$inline: true });

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Click Me";
    			t1 = space();
    			create_component(square.$$.fragment);
    			attr_dev(button, "class", "svelte-bhlv6");
    			add_location(button, file$3, 37, 2, 969);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, button, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(square, target, anchor);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(button, "click", /*toggle*/ ctx[2], false, false, false);
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(square.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(square.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			destroy_component(square, detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(37:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (33:1) {#if user.clicks}
    function create_if_block(ctx) {
    	let button;
    	let t1;
    	let current;
    	let dispose;

    	const circle = new Circle({
    			props: { text: "Just Like that" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Click Me";
    			t1 = space();
    			create_component(circle.$$.fragment);
    			attr_dev(button, "class", "svelte-bhlv6");
    			add_location(button, file$3, 33, 2, 872);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, button, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(circle, target, anchor);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(button, "click", /*toggle*/ ctx[2], false, false, false);
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(circle.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(circle.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			destroy_component(circle, detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(33:1) {#if user.clicks}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let t0;
    	let div;
    	let t1;
    	let br0;
    	let t2;
    	let t3;
    	let br1;
    	let t4;
    	let t5;
    	let img;
    	let img_src_value;
    	let t6;
    	let button;
    	let current;
    	let dispose;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*user*/ ctx[0].clicks) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	const butterfly0 = new Butterfly({ $$inline: true });
    	const butterfly1 = new Butterfly({ $$inline: true });
    	const butterfly2 = new Butterfly({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			if_block.c();
    			t0 = space();
    			div = element("div");
    			create_component(butterfly0.$$.fragment);
    			t1 = space();
    			br0 = element("br");
    			t2 = space();
    			create_component(butterfly1.$$.fragment);
    			t3 = space();
    			br1 = element("br");
    			t4 = space();
    			create_component(butterfly2.$$.fragment);
    			t5 = space();
    			img = element("img");
    			t6 = space();
    			button = element("button");
    			button.textContent = "Get Nature Pics";
    			add_location(br0, file$3, 45, 2, 1086);
    			add_location(br1, file$3, 47, 2, 1109);
    			attr_dev(div, "class", "app-container svelte-bhlv6");
    			add_location(div, file$3, 43, 2, 1040);
    			attr_dev(img, "alt", "");
    			if (img.src !== (img_src_value = /*naturePics*/ ctx[3][/*naturePicsIndex*/ ctx[1]])) attr_dev(img, "src", img_src_value);
    			add_location(img, file$3, 51, 2, 1142);
    			attr_dev(button, "class", "svelte-bhlv6");
    			add_location(button, file$3, 52, 2, 1191);
    			attr_dev(main, "class", "svelte-bhlv6");
    			add_location(main, file$3, 31, 0, 844);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, main, anchor);
    			if_blocks[current_block_type_index].m(main, null);
    			append_dev(main, t0);
    			append_dev(main, div);
    			mount_component(butterfly0, div, null);
    			append_dev(div, t1);
    			append_dev(div, br0);
    			append_dev(div, t2);
    			mount_component(butterfly1, div, null);
    			append_dev(div, t3);
    			append_dev(div, br1);
    			append_dev(div, t4);
    			mount_component(butterfly2, div, null);
    			append_dev(main, t5);
    			append_dev(main, img);
    			append_dev(main, t6);
    			append_dev(main, button);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(button, "click", /*naturePic*/ ctx[4], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(main, t0);
    			}

    			if (!current || dirty & /*naturePicsIndex*/ 2 && img.src !== (img_src_value = /*naturePics*/ ctx[3][/*naturePicsIndex*/ ctx[1]])) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(butterfly0.$$.fragment, local);
    			transition_in(butterfly1.$$.fragment, local);
    			transition_in(butterfly2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(butterfly0.$$.fragment, local);
    			transition_out(butterfly1.$$.fragment, local);
    			transition_out(butterfly2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_blocks[current_block_type_index].d();
    			destroy_component(butterfly0);
    			destroy_component(butterfly1);
    			destroy_component(butterfly2);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let user = { clicks: false };

    	function toggle() {
    		$$invalidate(0, user.clicks = !user.clicks, user);
    	}

    	//how to use Event Handlers
    	let naturePics = [
    		"https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
    		"https://images.unsplash.com/photo-1504567961542-e24d9439a724?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
    		"https://images.unsplash.com/photo-1508873881324-c92a3fc536ba?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60"
    	];

    	let naturePicsIndex = 0;

    	function naturePic() {
    		$$invalidate(1, naturePicsIndex += 1);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		Circle,
    		Butterfly,
    		Square,
    		user,
    		toggle,
    		naturePics,
    		naturePicsIndex,
    		naturePic
    	});

    	$$self.$inject_state = $$props => {
    		if ("user" in $$props) $$invalidate(0, user = $$props.user);
    		if ("naturePics" in $$props) $$invalidate(3, naturePics = $$props.naturePics);
    		if ("naturePicsIndex" in $$props) $$invalidate(1, naturePicsIndex = $$props.naturePicsIndex);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [user, naturePicsIndex, toggle, naturePics, naturePic];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
