var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/types.js
var require_types = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/types.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
  }
});

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/core.js
var require_core = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/core.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.h = exports._render = exports.hydrate = exports.render = exports.appendChildren = exports.strToHash = exports.removeAllChildNodes = exports.tick = exports.isSSR = void 0;
    require_types();
    var isSSR = () => typeof _nano !== "undefined" && _nano.isSSR === true;
    exports.isSSR = isSSR;
    exports.tick = Promise.prototype.then.bind(Promise.resolve());
    var removeAllChildNodes = (parent) => {
      while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
      }
    };
    exports.removeAllChildNodes = removeAllChildNodes;
    var strToHash = (s) => {
      let hash = 0;
      for (let i = 0; i < s.length; i++) {
        const chr = s.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0;
      }
      return Math.abs(hash).toString(32);
    };
    exports.strToHash = strToHash;
    var appendChildren = (element, children, escape = true) => {
      if (!Array.isArray(children)) {
        (0, exports.appendChildren)(element, [
          children
        ], escape);
        return;
      }
      if (typeof children === "object") children = Array.prototype.slice.call(children);
      children.forEach((child) => {
        if (Array.isArray(child)) (0, exports.appendChildren)(element, child, escape);
        else {
          const c = (0, exports._render)(child);
          if (typeof c !== "undefined") {
            if (Array.isArray(c)) (0, exports.appendChildren)(element, c, escape);
            else {
              if ((0, exports.isSSR)() && !escape) element.appendChild(c.nodeType == null ? c.toString() : c);
              else element.appendChild(c.nodeType == null ? document.createTextNode(c.toString()) : c);
            }
          }
        }
      });
    };
    exports.appendChildren = appendChildren;
    var SVG = (props) => {
      const child = props.children[0];
      const attrs = child.attributes;
      if ((0, exports.isSSR)()) return child;
      const svg = hNS("svg");
      for (let i = attrs.length - 1; i >= 0; i--) {
        svg.setAttribute(attrs[i].name, attrs[i].value);
      }
      svg.innerHTML = child.innerHTML;
      return svg;
    };
    var render = (component, parent = null, removeChildNodes = true) => {
      let el = (0, exports._render)(component);
      if (Array.isArray(el)) {
        el = el.map((e) => (0, exports._render)(e));
        if (el.length === 1) el = el[0];
      }
      if (parent) {
        if (removeChildNodes) (0, exports.removeAllChildNodes)(parent);
        if (el && parent.id && parent.id === el.id && parent.parentElement) {
          parent.parentElement.replaceChild(el, parent);
        } else {
          if (Array.isArray(el)) el.forEach((e) => {
            (0, exports.appendChildren)(parent, (0, exports._render)(e));
          });
          else (0, exports.appendChildren)(parent, (0, exports._render)(el));
        }
        return parent;
      } else {
        if ((0, exports.isSSR)() && !Array.isArray(el)) return [
          el
        ];
        return el;
      }
    };
    exports.render = render;
    exports.hydrate = exports.render;
    var _render = (comp) => {
      if (comp === null || comp === false || typeof comp === "undefined") return [];
      if (typeof comp === "string" || typeof comp === "number") return comp.toString();
      if (comp.tagName && comp.tagName.toLowerCase() === "svg") return SVG({
        children: [
          comp
        ]
      });
      if (comp.tagName) return comp;
      if (comp && comp.nodeType === 3) return comp;
      if (comp && comp.component && comp.component.isClass) return renderClassComponent(comp);
      if (comp.isClass) return renderClassComponent({
        component: comp,
        props: {}
      });
      if (comp.component && typeof comp.component === "function") return renderFunctionalComponent(comp);
      if (Array.isArray(comp)) return comp.map((c) => (0, exports._render)(c)).flat();
      if (typeof comp === "function" && !comp.isClass) return (0, exports._render)(comp());
      if (comp.component && comp.component.tagName && typeof comp.component.tagName === "string") return (0, exports._render)(comp.component);
      if (Array.isArray(comp.component)) return (0, exports._render)(comp.component);
      if (comp.component) return (0, exports._render)(comp.component);
      if (typeof comp === "object") return [];
      console.warn("Something unexpected happened with:", comp);
    };
    exports._render = _render;
    var renderFunctionalComponent = (fncComp) => {
      const { component, props } = fncComp;
      return (0, exports._render)(component(props));
    };
    var renderClassComponent = (classComp) => {
      const { component, props } = classComp;
      const hash = (0, exports.strToHash)(component.toString());
      component.prototype._getHash = () => hash;
      const Component = new component(props);
      if (!(0, exports.isSSR)()) Component.willMount();
      let el = Component.render();
      el = (0, exports._render)(el);
      Component.elements = el;
      if (props && props.ref) props.ref(Component);
      if (!(0, exports.isSSR)()) (0, exports.tick)(() => {
        Component._didMount();
      });
      return el;
    };
    var hNS = (tag) => document.createElementNS("http://www.w3.org/2000/svg", tag);
    var h = (tagNameOrComponent, props = {}, ...children) => {
      if (props && props.children) {
        if (Array.isArray(children)) {
          if (Array.isArray(props.children)) children = [
            ...props.children,
            ...children
          ];
          else children.push(props.children);
        } else {
          if (Array.isArray(props.children)) children = props.children;
          else children = [
            props.children
          ];
        }
      }
      if ((0, exports.isSSR)() && _nano.ssrTricks.isWebComponent(tagNameOrComponent)) {
        const element2 = _nano.ssrTricks.renderWebComponent(tagNameOrComponent, props, children, exports._render);
        if (element2 === null) return `ERROR: "<${tagNameOrComponent} />"`;
        else return element2;
      }
      if (typeof tagNameOrComponent !== "string") return {
        component: tagNameOrComponent,
        props: {
          ...props,
          children
        }
      };
      try {
        if ((0, exports.isSSR)() && typeof tagNameOrComponent === "string" && !document) throw new Error("document is not defined");
      } catch (err) {
        console.log("ERROR:", err.message, "\n > Please read: https://github.com/nanojsx/nano/issues/106");
      }
      let ref;
      const element = tagNameOrComponent === "svg" ? hNS("svg") : document.createElement(tagNameOrComponent);
      const isEvent = (el, p) => {
        if (0 !== p.indexOf("on")) return false;
        if (el._ssr) return true;
        return typeof el[p] === "object" || typeof el[p] === "function";
      };
      for (const p in props) {
        if (p === "style" && typeof props[p] === "object") {
          const styles = Object.keys(props[p]).map((k) => {
            const key = k.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
            return `${key}:${props[p][k]}`;
          }).join(";");
          props[p] = `${styles};`;
        }
        if (p === "ref") ref = props[p];
        else if (isEvent(element, p.toLowerCase())) element.addEventListener(p.toLowerCase().substring(2), (e) => props[p](e));
        else if (p === "dangerouslySetInnerHTML" && props[p].__html) {
          if (!(0, exports.isSSR)()) {
            const fragment = document.createElement("fragment");
            fragment.innerHTML = props[p].__html;
            element.appendChild(fragment);
          } else {
            element.innerHTML = props[p].__html;
          }
        } else if (p === "innerHTML" && props[p].__dangerousHtml) {
          if (!(0, exports.isSSR)()) {
            const fragment = document.createElement("fragment");
            fragment.innerHTML = props[p].__dangerousHtml;
            element.appendChild(fragment);
          } else {
            element.innerHTML = props[p].__dangerousHtml;
          }
        } else if (/^className$/i.test(p)) element.setAttribute("class", props[p]);
        else if (typeof props[p] !== "undefined") element.setAttribute(p, props[p]);
      }
      const escape = ![
        "noscript",
        "script",
        "style"
      ].includes(tagNameOrComponent);
      (0, exports.appendChildren)(element, children, escape);
      if (ref) ref(element);
      return element;
    };
    exports.h = h;
  }
});

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/version.js
var require_version = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/version.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.VERSION = void 0;
    exports.VERSION = "0.2.1";
  }
});

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/helpers.js
var require_helpers = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/helpers.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.printVersion = exports.escapeHtml = exports.onNodeRemove = exports.detectSSR = exports.nodeToString = exports.task = void 0;
    var version_js_1 = require_version();
    var task = (task2) => setTimeout(task2, 0);
    exports.task = task;
    var nodeToString = (node) => {
      const tmpNode = document.createElement("div");
      tmpNode.appendChild(node.cloneNode(true));
      return tmpNode.innerHTML;
    };
    exports.nodeToString = nodeToString;
    var detectSSR = () => {
      const isDeno = typeof Deno !== "undefined";
      const hasWindow = typeof window !== "undefined" ? true : false;
      return typeof _nano !== "undefined" && _nano.isSSR || isDeno || !hasWindow;
    };
    exports.detectSSR = detectSSR;
    function isDescendant(desc, root) {
      return !!desc && (desc === root || isDescendant(desc.parentNode, root));
    }
    var onNodeRemove = (element, callback) => {
      let observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach((mutation) => {
          mutation.removedNodes.forEach((removed) => {
            if (isDescendant(element, removed)) {
              callback();
              if (observer) {
                observer.disconnect();
                observer = void 0;
              }
            }
          });
        });
      });
      observer.observe(document, {
        childList: true,
        subtree: true
      });
      return observer;
    };
    exports.onNodeRemove = onNodeRemove;
    var escapeHtml = (unsafe) => {
      if (unsafe && typeof unsafe === "string") return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
      return unsafe;
    };
    exports.escapeHtml = escapeHtml;
    var printVersion = () => {
      const info = `Powered by nano JSX v${version_js_1.VERSION}`;
      console.log(`%c %c %c %c %c ${info} %c http://nanojsx.io`, "background: #ff0000", "background: #ffff00", "background: #00ff00", "background: #00ffff", "color: #fff; background: #000000;", "background: none");
    };
    exports.printVersion = printVersion;
  }
});

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/state.js
var require_state = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/state.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports._clearState = exports._state = void 0;
    exports._state = /* @__PURE__ */ new Map();
    var _clearState = () => {
      exports._state.clear();
    };
    exports._clearState = _clearState;
  }
});

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/component.js
var require_component = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/component.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.Component = void 0;
    exports.renderComponentGetReference = renderComponentGetReference;
    var helpers_js_1 = require_helpers();
    var core_js_1 = require_core();
    var state_js_1 = require_state();
    var Component = class {
      constructor(props) {
        this._elements = [];
        this._skipUnmount = false;
        this._hasUnmounted = false;
        this.props = props || {};
        this.id = this._getHash();
      }
      static get isClass() {
        return true;
      }
      get isClass() {
        return true;
      }
      setState(state, shouldUpdate = false) {
        const isObject = typeof state === "object" && state !== null;
        if (isObject && this.state !== void 0) this.state = {
          ...this.state,
          ...state
        };
        else this.state = state;
        if (shouldUpdate) this.update();
      }
      set state(state) {
        state_js_1._state.set(this.id, state);
      }
      get state() {
        return state_js_1._state.get(this.id);
      }
      set initState(state) {
        if (this.state === void 0) this.state = state;
      }
      /** Returns all currently rendered node elements */
      get elements() {
        return this._elements || [];
      }
      set elements(elements) {
        if (!Array.isArray(elements)) elements = [
          elements
        ];
        elements.forEach((element) => {
          this._elements.push(element);
        });
      }
      _addNodeRemoveListener() {
        if (/^[^{]+{\s+}$/gm.test(this.didUnmount.toString())) return;
        (0, helpers_js_1.onNodeRemove)(this.elements[0], () => {
          if (!this._skipUnmount) this._didUnmount();
        });
      }
      // @ts-ignore
      _didMount() {
        this._addNodeRemoveListener();
        this.didMount();
      }
      _willUpdate() {
        this.willUpdate();
      }
      _didUpdate() {
        this.didUpdate();
      }
      _didUnmount() {
        if (this._hasUnmounted) return;
        this.didUnmount();
        this._hasUnmounted = true;
      }
      willMount() {
      }
      didMount() {
      }
      willUpdate() {
      }
      didUpdate() {
      }
      didUnmount() {
      }
      render(_update) {
      }
      /** Will forceRender the component */
      update(update) {
        this._skipUnmount = true;
        this._willUpdate();
        const oldElements = [
          ...this.elements
        ];
        this._elements = [];
        let el = this.render(update);
        el = (0, core_js_1._render)(el);
        this.elements = el;
        const parent = oldElements[0].parentNode;
        if (!parent) console.warn("Component needs a parent element to get updated!");
        this.elements.forEach((child) => {
          if (parent) parent.insertBefore(child, oldElements[0]);
        });
        oldElements.forEach((child) => {
          if (!this.elements.includes(child)) {
            child.remove();
            child = null;
          }
        });
        this._addNodeRemoveListener();
        (0, core_js_1.tick)(() => {
          this._skipUnmount = false;
          if (!this.elements[0].isConnected) this._didUnmount();
          else this._didUpdate();
        });
      }
      _getHash() {
      }
    };
    exports.Component = Component;
    function renderComponentGetReference(C, props, children, parent) {
      return new Promise((resolve) => {
        (0, core_js_1.render)((0, core_js_1.h)(C, {
          ...props,
          ref: (el) => resolve(el)
        }, ...children), parent);
      });
    }
  }
});

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/components/helmet.js
var require_helmet = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/components/helmet.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.Helmet = void 0;
    var component_js_1 = require_component();
    var core_js_1 = require_core();
    var Attributes = class extends Map {
      toString() {
        let string = "";
        for (const [key, value] of this) string += ` ${key}="${value}"`;
        return string.trim();
      }
    };
    var Helmet = class extends component_js_1.Component {
      static SSR(body) {
        var _a, _b;
        const reg = /(<helmet\b[^>]*>)((.|\r|\n)*?)(<\/helmet>)/gm;
        const head = [];
        const footer = [];
        const attributes = {
          html: new Attributes(),
          body: new Attributes()
        };
        if (typeof document !== "undefined" && document.head) {
          let children = [];
          children = [].slice.call(document.head.children);
          for (let i = 0; i < children.length; i++) {
            if (head.indexOf(children[i]) === -1) {
              head.push(children[i]);
            }
          }
        }
        let result;
        while ((result = reg.exec(body)) !== null) {
          const first = result[1];
          let second = result[2];
          const regHTML = /<html\s([^>]+)><\/html>/gm;
          const regBody = /<body\s([^>]+)><\/body>/gm;
          const regAttr = /(\w+)="([^"]+)"/gm;
          let res = null;
          (_a = body.match(regHTML)) === null || _a === void 0 ? void 0 : _a.forEach((h) => {
            second = second.replace(h, "");
            while ((res = regAttr.exec(h)) !== null) {
              attributes.html.set(res[1], res[2]);
            }
          });
          (_b = body.match(regBody)) === null || _b === void 0 ? void 0 : _b.forEach((b) => {
            second = second.replace(b, "");
            while ((res = regAttr.exec(b)) !== null) {
              attributes.body.set(res[1], res[2]);
            }
          });
          const toHead = first.includes('data-placement="head"');
          if (toHead && !head.includes(second)) head.push(second);
          else if (!toHead && !footer.includes(second)) footer.push(second);
        }
        const cleanBody = body.replace(reg, "");
        return {
          body: cleanBody,
          head,
          footer,
          attributes
        };
      }
      didMount() {
        this.props.children.forEach((element) => {
          var _a, _b, _c, _d;
          if (!(element instanceof HTMLElement)) return;
          const parent = this.props.footer ? document.body : document.head;
          const tag = element.tagName;
          let attrs = [];
          attrs.push(element.innerText);
          for (let attr = 0; attr < element.attributes.length; attr++) {
            attrs.push((_a = element.attributes.item(attr)) === null || _a === void 0 ? void 0 : _a.name.toLowerCase());
            attrs.push((_b = element.attributes.item(attr)) === null || _b === void 0 ? void 0 : _b.value.toLowerCase());
          }
          if (tag === "HTML" || tag === "BODY") {
            const htmlTag = document.getElementsByTagName(tag)[0];
            for (let attr = 1; attr < attrs.length; attr += 2) {
              htmlTag.setAttribute(attrs[attr], attrs[attr + 1]);
            }
            return;
          } else if (tag === "TITLE") {
            const titleTags = document.getElementsByTagName("TITLE");
            if (titleTags.length > 0) {
              const e = element;
              titleTags[0].text = e.text;
            } else {
              const titleTag = (0, core_js_1.h)("title", null, element.innerHTML);
              (0, core_js_1.appendChildren)(parent, [
                titleTag
              ], false);
            }
            return;
          }
          let exists = false;
          attrs = attrs.sort();
          const el = document.getElementsByTagName(tag);
          for (let i = 0; i < el.length; i++) {
            let attrs2 = [];
            attrs2.push(el[i].innerText);
            for (let attr = 0; attr < el[i].attributes.length; attr++) {
              attrs2.push((_c = el[i].attributes.item(attr)) === null || _c === void 0 ? void 0 : _c.name.toLowerCase());
              attrs2.push((_d = el[i].attributes.item(attr)) === null || _d === void 0 ? void 0 : _d.value.toLowerCase());
            }
            attrs2 = attrs2.sort();
            if (attrs.length > 0 && attrs2.length > 0 && JSON.stringify(attrs) === JSON.stringify(attrs2)) exists = true;
          }
          if (!exists) (0, core_js_1.appendChildren)(parent, [
            element
          ], false);
        });
      }
      render() {
        const placement = this.props.footer ? "footer" : "head";
        if ((0, core_js_1.isSSR)()) return (0, core_js_1.h)("helmet", {
          "data-ssr": true,
          "data-placement": placement
        }, this.props.children);
        else return [];
      }
    };
    exports.Helmet = Helmet;
  }
});

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/components/img.js
var require_img = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/components/img.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.Img = void 0;
    var component_js_1 = require_component();
    var core_js_1 = require_core();
    var Img = class extends component_js_1.Component {
      constructor(props) {
        super(props);
        const { src, key } = props;
        this.id = `${(0, core_js_1.strToHash)(src)}-${(0, core_js_1.strToHash)(JSON.stringify(props))}`;
        if (key) this.id += `key-${key}`;
        if (!this.state) this.setState({
          isLoaded: false,
          image: void 0
        });
      }
      didMount() {
        const { lazy = true, placeholder, children, key, ref, ...rest } = this.props;
        if (typeof lazy === "boolean" && lazy === false) return;
        const observer = new IntersectionObserver((entries, observer2) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              observer2.disconnect();
              this.state.image = (0, core_js_1.h)("img", {
                ...rest
              });
              if (this.state.image.complete) {
                this.state.isLoaded = true;
                this.update();
              } else {
                this.state.image.onload = () => {
                  this.state.isLoaded = true;
                  this.update();
                };
              }
            }
          });
        }, {
          threshold: [
            0,
            1
          ]
        });
        observer.observe(this.elements[0]);
      }
      render() {
        const { src, placeholder, children, lazy = true, key, ref, ...rest } = this.props;
        if (typeof lazy === "boolean" && lazy === false) {
          this.state.image = (0, core_js_1.h)("img", {
            src,
            ...rest
          });
          return this.state.image;
        }
        if (this.state.isLoaded) {
          return this.state.image;
        } else if (placeholder && typeof placeholder === "string") {
          return (0, core_js_1.h)("img", {
            src: placeholder,
            ...rest
          });
        } else if (placeholder && typeof placeholder === "function") {
          return placeholder();
        } else {
          const style = {};
          if (rest.width) style.width = `${rest.width}px`;
          if (rest.height) style.height = `${rest.height}px`;
          const { width, height, ...others } = rest;
          return (0, core_js_1.h)("div", {
            style,
            ...others
          });
        }
      }
    };
    exports.Img = Img;
  }
});

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/fragment.js
var require_fragment = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/fragment.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.Fragment = void 0;
    var Fragment = (props) => {
      return props.children;
    };
    exports.Fragment = Fragment;
  }
});

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/components/link.js
var require_link = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/components/link.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.Link = void 0;
    var component_js_1 = require_component();
    var helmet_js_1 = require_helmet();
    var core_js_1 = require_core();
    var fragment_js_1 = require_fragment();
    var Link = class extends component_js_1.Component {
      prefetchOnHover() {
        this.elements[0].addEventListener("mouseover", () => this.addPrefetch(), {
          once: true
        });
      }
      prefetchOnVisible() {
        const observer = new IntersectionObserver((entries, observer2) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              observer2.disconnect();
              this.addPrefetch();
            }
          });
        }, {
          threshold: [
            0,
            1
          ]
        });
        observer.observe(this.elements[0]);
      }
      addPrefetch() {
        let doesAlreadyExist = false;
        const links = document.getElementsByTagName("link");
        for (let i = 0; i < links.length; i++) {
          if (links[i].getAttribute("rel") === "prefetch" && links[i].getAttribute("href") === this.props.href) {
            doesAlreadyExist = true;
          }
        }
        if (!doesAlreadyExist) {
          const prefetch = (0, core_js_1.h)("link", {
            rel: "prefetch",
            href: this.props.href,
            as: "document"
          });
          document.head.appendChild(prefetch);
        }
      }
      didMount() {
        const { href, prefetch, delay = 0, back = false } = this.props;
        if (back) this.elements[0].addEventListener("click", (e) => {
          e.preventDefault();
          const target = e.target;
          if (target.href === document.referrer) window.history.back();
          else window.location.href = target.href;
        });
        if (delay > 0) this.elements[0].addEventListener("click", (e) => {
          e.preventDefault();
          setTimeout(() => window.location.href = href, delay);
        });
        if (prefetch) {
          if (prefetch === "hover") this.prefetchOnHover();
          else if (prefetch === "visible") this.prefetchOnVisible();
          else this.addPrefetch();
        }
      }
      render() {
        const { children, prefetch, back, ref, ...rest } = this.props;
        if (!this.props.href) console.warn('Please add "href" to <Link>');
        if (children.length !== 1) console.warn("Please add ONE child to <Link> (<Link>child</Link>)");
        const a = (0, core_js_1.h)("a", {
          ...rest
        }, ...children);
        if (prefetch === true && !(typeof window !== "undefined" && window.document)) {
          const link = (0, core_js_1.h)("link", {
            rel: "prefetch",
            href: this.props.href,
            as: "document"
          });
          const helmet = (0, core_js_1.h)(helmet_js_1.Helmet, null, link);
          return (0, core_js_1.h)(fragment_js_1.Fragment, null, [
            helmet,
            a
          ]);
        } else {
          return a;
        }
      }
    };
    exports.Link = Link;
  }
});

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/components/router.js
var require_router = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/components/router.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.parseParamsFromPath = exports.Listener = exports.Link = exports.to = exports.Route = exports.Routes = exports.Switch = exports.matchPath = void 0;
    var component_js_1 = require_component();
    var core_js_1 = require_core();
    var instances = [];
    var register = (comp) => instances.push(comp);
    var unregister = (comp) => instances.splice(instances.indexOf(comp), 1);
    var historyPush = (path) => {
      window.history.pushState({}, "", path);
      instances.forEach((instance) => instance.handleChanges());
      window.dispatchEvent(new Event("pushstate"));
    };
    var historyReplace = (path) => {
      window.history.replaceState({}, "", path);
      instances.forEach((instance) => instance.handleChanges());
      window.dispatchEvent(new Event("replacestate"));
    };
    var matchPath = (pathname, options) => {
      const { exact = false, regex } = options;
      let { path } = options;
      if (!path) {
        return {
          path: null,
          url: pathname,
          isExact: true,
          params: {}
        };
      }
      let match;
      let params = {};
      if (path.includes("/:")) {
        const pathArr = path.split("/");
        const pathnameArr = pathname.split("/");
        pathArr.forEach((p, i) => {
          if (/^:/.test(p)) {
            const key = p.slice(1);
            const value = pathnameArr[i];
            if (regex && regex[key]) {
              const regexMatch = regex[key].test(value);
              if (!regexMatch) return null;
            }
            params = {
              ...params,
              [key]: value
            };
            pathArr[i] = pathnameArr[i];
          }
        });
        path = pathArr.join("/");
      }
      if (path === "*") match = [
        pathname
      ];
      if (!match) match = new RegExp(`^${path}`).exec(pathname);
      if (!match) return null;
      const url = match[0];
      const isExact = pathname === url;
      if (exact && !isExact) return null;
      return {
        path,
        url,
        isExact,
        params
      };
    };
    exports.matchPath = matchPath;
    var Switch = class extends component_js_1.Component {
      constructor() {
        super(...arguments);
        this.index = 0;
        this.path = "";
        this.match = {
          index: -1,
          path: ""
        };
      }
      didMount() {
        window.addEventListener("popstate", this.handleChanges.bind(this));
        register(this);
      }
      didUnmount() {
        window.removeEventListener("popstate", this.handleChanges.bind(this));
        unregister(this);
      }
      handleChanges() {
        this.findChild();
        if (this.shouldUpdate()) this.update();
      }
      findChild() {
        this.match = {
          index: -1,
          path: ""
        };
        this.props.children = this.props.children.flat();
        for (let i = 0; i < this.props.children.length; i++) {
          const child = this.props.children[i];
          const { path, exact, regex } = child.props;
          const match = (0, exports.matchPath)((0, core_js_1.isSSR)() ? _nano.location.pathname : window.location.pathname, {
            path,
            exact,
            regex
          });
          if (match) {
            this.match.index = i;
            this.match.path = path;
            return;
          }
        }
      }
      shouldUpdate() {
        return this.path !== this.match.path || this.index !== this.match.index;
      }
      render() {
        this.findChild();
        const child = this.props.children[this.match.index];
        if (this.match.index === -1) {
          this.path = "";
          this.index = 0;
        }
        if (child) {
          const { path } = child.props;
          this.path = path;
          this.index = this.match.index;
          const el = (0, core_js_1._render)(child);
          return (0, core_js_1.h)("div", {}, (0, core_js_1._render)(el));
        } else if (this.props.fallback) {
          return (0, core_js_1.h)("div", {}, (0, core_js_1._render)(this.props.fallback));
        } else {
          return (0, core_js_1.h)("div", {}, "not found");
        }
      }
    };
    exports.Switch = Switch;
    var Routes = class extends Switch {
    };
    exports.Routes = Routes;
    var Route = ({ path, regex, children }) => {
      const pathname = (0, core_js_1.isSSR)() ? _nano.location.pathname : window.location.pathname;
      const params = (0, exports.parseParamsFromPath)(path);
      children.forEach((child) => {
        if (child.props) child.props = {
          ...child.props,
          route: {
            path,
            regex,
            pathname,
            params
          }
        };
      });
      return children;
    };
    exports.Route = Route;
    var to = (to2, replace = false) => {
      replace ? historyReplace(to2) : historyPush(to2);
    };
    exports.to = to;
    var Link = ({ to: to2, replace, children, ...rest }) => {
      const handleClick = (event) => {
        event.preventDefault();
        replace ? historyReplace(to2) : historyPush(to2);
      };
      return (0, core_js_1.h)("a", {
        href: to2,
        onClick: (e) => handleClick(e),
        ...rest
      }, children);
    };
    exports.Link = Link;
    var CListener = class {
      constructor() {
        this._listeners = /* @__PURE__ */ new Map();
        if ((0, core_js_1.isSSR)()) return;
        this._route = window.location.pathname;
        const event = (e) => {
          const newRoute = window.location.pathname;
          this._listeners.forEach((fnc) => {
            fnc(newRoute, this._route, e);
          });
          this._route = newRoute;
        };
        window.addEventListener("pushstate", event);
        window.addEventListener("replacestate", event);
        window.addEventListener("popstate", event);
      }
      use() {
        const id = Math.random().toString(36).substring(2);
        return {
          subscribe: (fnc) => {
            this._listeners.set(id, fnc);
          },
          cancel: () => {
            if (this._listeners.has(id)) this._listeners.delete(id);
          }
        };
      }
    };
    var listener;
    var Listener = () => {
      if (!listener) listener = new CListener();
      return listener;
    };
    exports.Listener = Listener;
    var parseParamsFromPath = (path) => {
      let params = {};
      const _pathname = (0, core_js_1.isSSR)() ? _nano.location.pathname.split("/") : window.location.pathname.split("/");
      path.split("/").forEach((p, i) => {
        if (p.startsWith(":")) params = {
          ...params,
          [p.slice(1)]: _pathname[i]
        };
      });
      return params;
    };
    exports.parseParamsFromPath = parseParamsFromPath;
  }
});

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/components/suspense.js
var require_suspense = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/components/suspense.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.Suspense = void 0;
    var component_js_1 = require_component();
    var core_js_1 = require_core();
    var Suspense = class extends component_js_1.Component {
      constructor(props) {
        super(props);
        this.ready = false;
        const { children, fallback, cache = false, ...rest } = this.props;
        const str = JSON.stringify(rest, function(_key, val) {
          if (typeof val === "function") return `${val}`;
          return val;
        });
        this.id = (0, core_js_1.strToHash)(JSON.stringify(str));
      }
      async didMount() {
        const { children, fallback, cache = false, ...rest } = this.props;
        if (cache) this.initState = {};
        if (this.loadFromCache(cache)) return;
        const promises = Object.values(rest).map((p) => p());
        const resolved = await Promise.all(promises);
        const data = this.prepareData(rest, resolved, cache);
        this.addDataToChildren(data);
        this.ready = true;
        this.update();
      }
      ssr() {
        const { children, fallback, cache = false, ...rest } = this.props;
        const functions = Object.values(rest).map((p) => p());
        const data = this.prepareData(rest, functions, false);
        this.addDataToChildren(data);
      }
      loadFromCache(cache) {
        const hasCachedProps = this.state && cache && Object.keys(this.state).length > 0;
        if (hasCachedProps) {
          this.addDataToChildren(this.state);
          this.ready = true;
        }
        return hasCachedProps;
      }
      prepareData(rest, fnc, cache) {
        const data = Object.keys(rest).reduce((obj, item, index) => {
          if (cache) this.state = {
            ...this.state,
            [item]: fnc[index]
          };
          return {
            ...obj,
            [item]: fnc[index]
          };
        }, {});
        return data;
      }
      addDataToChildren(data) {
        this.props.children.forEach((child) => {
          if (child.props) child.props = {
            ...child.props,
            ...data
          };
        });
      }
      render() {
        if (!(0, core_js_1.isSSR)()) {
          const { cache = false } = this.props;
          this.loadFromCache(cache);
          return !this.ready ? this.props.fallback : this.props.children;
        } else {
          this.ssr();
          return this.props.children;
        }
      }
    };
    exports.Suspense = Suspense;
  }
});

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/components/visible.js
var require_visible = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/components/visible.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.Visible = void 0;
    var core_js_1 = require_core();
    var component_js_1 = require_component();
    var Visible = class extends component_js_1.Component {
      constructor() {
        super(...arguments);
        this.isVisible = false;
      }
      didMount() {
        const observer = new IntersectionObserver((entries, observer2) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              observer2.disconnect();
              this.isVisible = true;
              this.update();
            }
          });
        }, {
          threshold: [
            0,
            1
          ]
        });
        observer.observe(this.elements[0]);
      }
      render() {
        if (!this.isVisible) {
          return (0, core_js_1.h)("div", {
            "data-visible": false,
            visibility: "hidden"
          });
        } else {
          if (this.props.onVisible) this.props.onVisible();
          return (0, core_js_1.render)(this.props.component || this.props.children[0]);
        }
      }
    };
    exports.Visible = Visible;
  }
});

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/components/index.js
var require_components = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/components/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = {
          enumerable: true,
          get: function() {
            return m[k];
          }
        };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", {
        enumerable: true,
        value: v
      });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    }();
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.Visible = exports.Suspense = exports.Router = exports.Link = exports.Img = exports.Helmet = void 0;
    var helmet_js_1 = require_helmet();
    Object.defineProperty(exports, "Helmet", {
      enumerable: true,
      get: function() {
        return helmet_js_1.Helmet;
      }
    });
    var img_js_1 = require_img();
    Object.defineProperty(exports, "Img", {
      enumerable: true,
      get: function() {
        return img_js_1.Img;
      }
    });
    var link_js_1 = require_link();
    Object.defineProperty(exports, "Link", {
      enumerable: true,
      get: function() {
        return link_js_1.Link;
      }
    });
    exports.Router = __importStar(require_router());
    var suspense_js_1 = require_suspense();
    Object.defineProperty(exports, "Suspense", {
      enumerable: true,
      get: function() {
        return suspense_js_1.Suspense;
      }
    });
    var visible_js_1 = require_visible();
    Object.defineProperty(exports, "Visible", {
      enumerable: true,
      get: function() {
        return visible_js_1.Visible;
      }
    });
  }
});

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/regexDom.js
var require_regexDom = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/regexDom.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.documentSSR = exports.DocumentSSR = exports.HTMLElementSSR = void 0;
    var helpers_js_1 = require_helpers();
    var HTMLElementSSR = class {
      constructor(tag) {
        this.isSelfClosing = false;
        this.nodeType = null;
        this.tagName = tag;
        const selfClosing = [
          "area",
          "base",
          "br",
          "col",
          "embed",
          "hr",
          "img",
          "input",
          "link",
          "meta",
          "param",
          "source",
          "track",
          "wbr"
        ];
        this.nodeType = 1;
        if (selfClosing.indexOf(tag) >= 0) {
          this._ssr = `<${tag} />`;
          this.isSelfClosing = true;
        } else {
          this._ssr = `<${tag}></${tag}>`;
        }
      }
      get outerHTML() {
        return this.toString();
      }
      get innerHTML() {
        return this.innerText;
      }
      set innerHTML(text) {
        this.innerText = text;
      }
      get innerText() {
        var _a;
        const reg = /(^<[^>]+>)(.+)?(<\/[a-z0-9]+>$|\/>$)/gm;
        return ((_a = reg.exec(this._ssr)) === null || _a === void 0 ? void 0 : _a[2]) || "";
      }
      set innerText(text) {
        const reg = /(^<[^>]+>)(.+)?(<\/[a-z0-9]+>$|\/>$)/gm;
        const replacer = (_match, p1, _p2, p3) => [
          p1,
          text,
          p3
        ].join("");
        this._ssr = this._ssr.replace(reg, replacer);
      }
      getAttribute(_name) {
        return null;
      }
      get classList() {
        const element = this._ssr;
        const classesRegex = /^<\w+.+(\sclass=")([^"]+)"/gm;
        return {
          add: (name) => {
            this.setAttribute("class", name);
          },
          entries: {
            get length() {
              const classes = classesRegex.exec(element);
              if (classes && classes[2]) return classes[2].split(" ").length;
              return 0;
            }
          }
        };
      }
      toString() {
        return this._ssr;
      }
      setAttributeNS(_namespace, name, value) {
        this.setAttribute(name, value);
      }
      setAttribute(name, value) {
        const replacer1 = (_match, p1, p2) => `${p1}${(0, helpers_js_1.escapeHtml)(name)}="${(0, helpers_js_1.escapeHtml)(value)}" ${p2}`;
        const replacer2 = (_match, p1, p2) => `${p1} ${(0, helpers_js_1.escapeHtml)(name)}="${(0, helpers_js_1.escapeHtml)(value)}"${p2}`;
        if (this.isSelfClosing) this._ssr = this._ssr.replace(/(^<[a-z0-9]+ )(.+)/gm, replacer1);
        else this._ssr = this._ssr.replace(/(^<[^>]+)(.+)/gm, replacer2);
      }
      append(child) {
        this.appendChild(child);
      }
      appendChild(child) {
        const index = this._ssr.lastIndexOf("</");
        this._ssr = this._ssr.substring(0, index) + child + this._ssr.substring(index);
      }
      get children() {
        const reg = /<([a-z0-9]+)((?!<\/\1).)*<\/\1>/gms;
        const array = [];
        let match;
        while ((match = reg.exec(this.innerHTML)) !== null) {
          array.push(match[0].replace(/[\s]+/gm, " "));
        }
        return array;
      }
      addEventListener(_type, _listener, _options) {
      }
    };
    exports.HTMLElementSSR = HTMLElementSSR;
    var DocumentSSR = class {
      constructor() {
        this.body = this.createElement("body");
        this.head = this.createElement("head");
      }
      createElement(tag) {
        return new HTMLElementSSR(tag);
      }
      createElementNS(_URI, tag) {
        return this.createElement(tag);
      }
      createTextNode(text) {
        return (0, helpers_js_1.escapeHtml)(text);
      }
      querySelector(_query) {
        return void 0;
      }
    };
    exports.DocumentSSR = DocumentSSR;
    var documentSSR = () => {
      return new DocumentSSR();
    };
    exports.documentSSR = documentSSR;
  }
});

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/ssr.js
var require_ssr = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/ssr.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.clearState = exports.renderSSR = exports.initSSR = void 0;
    var core_js_1 = require_core();
    var regexDom_js_1 = require_regexDom();
    var state_js_1 = require_state();
    var helpers_js_1 = require_helpers();
    var ssrTricks = {
      isWebComponent: (tagNameOrComponent) => {
        return typeof tagNameOrComponent === "string" && tagNameOrComponent.includes("-") && _nano.customElements.has(tagNameOrComponent);
      },
      renderWebComponent: (tagNameOrComponent, props, children, _render) => {
        const customElement = _nano.customElements.get(tagNameOrComponent);
        const component = _render({
          component: customElement,
          props: {
            ...props,
            children
          }
        });
        const match = component.toString().match(/^<(?<tag>[a-z]+)>(.*)<\/\k<tag>>$/);
        if (match) {
          let replacer = function(match2, p1, _offset, _string) {
            return match2.replace(p1, "");
          };
          const element = document.createElement(match[1]);
          element.innerText = match[2];
          element.innerText = element.innerText.replace(/<\w+[^>]*(\s(on\w*)="[^"]*")/gm, replacer);
          return element;
        } else {
          return null;
        }
      }
    };
    var initGlobalVar = () => {
      const isSSR = (0, helpers_js_1.detectSSR)() === true ? true : void 0;
      const location = {
        pathname: "/"
      };
      const document2 = isSSR ? (0, regexDom_js_1.documentSSR)() : window.document;
      globalThis._nano = {
        isSSR,
        location,
        document: document2,
        customElements: /* @__PURE__ */ new Map(),
        ssrTricks
      };
    };
    initGlobalVar();
    var initSSR = (pathname = "/") => {
      _nano.location = {
        pathname
      };
      globalThis.document = _nano.document = (0, core_js_1.isSSR)() ? (0, regexDom_js_1.documentSSR)() : window.document;
    };
    exports.initSSR = initSSR;
    var renderSSR = (component, options = {}) => {
      const { pathname, clearState: clearState2 = true } = options;
      (0, exports.initSSR)(pathname);
      if (clearState2) state_js_1._state.clear();
      const tmp = (0, core_js_1.render)(component, null, true);
      if (Array.isArray(tmp)) return tmp.join("");
      else return Array.from(tmp).join("");
    };
    exports.renderSSR = renderSSR;
    var clearState = () => {
      state_js_1._state.clear();
    };
    exports.clearState = clearState;
  }
});

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/htm/constants.js
var require_constants = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/htm/constants.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.MINI = void 0;
    exports.MINI = false;
  }
});

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/htm/build.js
var require_build = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/htm/build.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.build = exports.evaluate = exports.treeify = void 0;
    var constants_js_1 = require_constants();
    var MODE_SLASH = 0;
    var MODE_TEXT = 1;
    var MODE_WHITESPACE = 2;
    var MODE_TAGNAME = 3;
    var MODE_COMMENT = 4;
    var MODE_PROP_SET = 5;
    var MODE_PROP_APPEND = 6;
    var CHILD_APPEND = 0;
    var CHILD_RECURSE = 2;
    var TAG_SET = 3;
    var PROPS_ASSIGN = 4;
    var PROP_SET = MODE_PROP_SET;
    var PROP_APPEND = MODE_PROP_APPEND;
    var treeify = (built, fields) => {
      const _treeify = (built2) => {
        let tag = "";
        let currentProps = null;
        const props = [];
        const children2 = [];
        for (let i = 1; i < built2.length; i++) {
          const type = built2[i++];
          const value = built2[i] ? fields[built2[i++] - 1] : built2[++i];
          if (type === TAG_SET) {
            tag = value;
          } else if (type === PROPS_ASSIGN) {
            props.push(value);
            currentProps = null;
          } else if (type === PROP_SET) {
            if (!currentProps) {
              currentProps = /* @__PURE__ */ Object.create(null);
              props.push(currentProps);
            }
            currentProps[built2[++i]] = [
              value
            ];
          } else if (type === PROP_APPEND) {
            currentProps[built2[++i]].push(value);
          } else if (type === CHILD_RECURSE) {
            children2.push(_treeify(value));
          } else if (type === CHILD_APPEND) {
            children2.push(value);
          }
        }
        return {
          tag,
          props,
          children: children2
        };
      };
      const { children } = _treeify(built);
      return children.length > 1 ? children : children[0];
    };
    exports.treeify = treeify;
    var evaluate = (h, built, fields, args) => {
      let tmp;
      built[0] = 0;
      for (let i = 1; i < built.length; i++) {
        const type = built[i++];
        const value = built[i] ? (built[0] |= type ? 1 : 2, fields[built[i++]]) : built[++i];
        if (type === TAG_SET) {
          args[0] = value;
        } else if (type === PROPS_ASSIGN) {
          args[1] = Object.assign(args[1] || {}, value);
        } else if (type === PROP_SET) {
          ;
          (args[1] = args[1] || {})[built[++i]] = value;
        } else if (type === PROP_APPEND) {
          args[1][built[++i]] += `${value}`;
        } else if (type) {
          tmp = h.apply(value, (0, exports.evaluate)(h, value, fields, [
            "",
            null
          ]));
          args.push(tmp);
          if (value[0]) {
            built[0] |= 2;
          } else {
            built[i - 2] = CHILD_APPEND;
            built[i] = tmp;
          }
        } else {
          args.push(value);
        }
      }
      return args;
    };
    exports.evaluate = evaluate;
    var build = function(statics, ...rest) {
      const fields = [
        statics,
        ...rest
      ];
      const h = this;
      let mode = MODE_TEXT;
      let buffer = "";
      let quote = "";
      let current = [
        0
      ];
      let char;
      let propName;
      const commit = (field) => {
        if (mode === MODE_TEXT && (field || (buffer = buffer.replace(/^\s*\n\s*|\s*\n\s*$/g, "")))) {
          if (constants_js_1.MINI) {
            current.push(field ? fields[field] : buffer);
          } else {
            current.push(CHILD_APPEND, field, buffer);
          }
        } else if (mode === MODE_TAGNAME && (field || buffer)) {
          if (constants_js_1.MINI) {
            current[1] = field ? fields[field] : buffer;
          } else {
            current.push(TAG_SET, field, buffer);
          }
          mode = MODE_WHITESPACE;
        } else if (mode === MODE_WHITESPACE && buffer === "..." && field) {
          if (constants_js_1.MINI) {
            current[2] = Object.assign(current[2] || {}, fields[field]);
          } else {
            current.push(PROPS_ASSIGN, field, 0);
          }
        } else if (mode === MODE_WHITESPACE && buffer && !field) {
          if (constants_js_1.MINI) {
            ;
            (current[2] = current[2] || {})[buffer] = true;
          } else {
            current.push(PROP_SET, 0, true, buffer);
          }
        } else if (mode >= MODE_PROP_SET) {
          if (constants_js_1.MINI) {
            if (mode === MODE_PROP_SET) {
              ;
              (current[2] = current[2] || {})[propName] = field ? buffer ? buffer + fields[field] : fields[field] : buffer;
              mode = MODE_PROP_APPEND;
            } else if (field || buffer) {
              current[2][propName] += field ? buffer + fields[field] : buffer;
            }
          } else {
            if (buffer || !field && mode === MODE_PROP_SET) {
              current.push(mode, 0, buffer, propName);
              mode = MODE_PROP_APPEND;
            }
            if (field) {
              current.push(mode, field, 0, propName);
              mode = MODE_PROP_APPEND;
            }
          }
        }
        buffer = "";
      };
      for (let i = 0; i < statics.length; i++) {
        if (i) {
          if (mode === MODE_TEXT) {
            commit();
          }
          commit(i);
        }
        for (let j = 0; j < statics[i].length; j++) {
          char = statics[i][j];
          if (mode === MODE_TEXT) {
            if (char === "<") {
              commit();
              if (constants_js_1.MINI) {
                current = [
                  current,
                  "",
                  null
                ];
              } else {
                current = [
                  current
                ];
              }
              mode = MODE_TAGNAME;
            } else {
              buffer += char;
            }
          } else if (mode === MODE_COMMENT) {
            if (buffer === "--" && char === ">") {
              mode = MODE_TEXT;
              buffer = "";
            } else {
              buffer = char + buffer[0];
            }
          } else if (quote) {
            if (char === quote) {
              quote = "";
            } else {
              buffer += char;
            }
          } else if (char === '"' || char === "'") {
            quote = char;
          } else if (char === ">") {
            commit();
            mode = MODE_TEXT;
          } else if (!mode) {
          } else if (char === "=") {
            mode = MODE_PROP_SET;
            propName = buffer;
            buffer = "";
          } else if (char === "/" && (mode < MODE_PROP_SET || statics[i][j + 1] === ">")) {
            commit();
            if (mode === MODE_TAGNAME) {
              current = current[0];
            }
            mode = current;
            if (constants_js_1.MINI) {
              ;
              (current = current[0]).push(h(...mode.slice(1)));
            } else {
              ;
              (current = current[0]).push(CHILD_RECURSE, 0, mode);
            }
            mode = MODE_SLASH;
          } else if (char === " " || char === "	" || char === "\n" || char === "\r") {
            commit();
            mode = MODE_WHITESPACE;
          } else {
            buffer += char;
          }
          if (mode === MODE_TAGNAME && buffer === "!--") {
            mode = MODE_COMMENT;
            current = current[0];
          }
        }
      }
      commit();
      if (constants_js_1.MINI) {
        return current.length > 2 ? current.slice(1) : current[1];
      }
      return current;
    };
    exports.build = build;
  }
});

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/htm/index.js
var require_htm = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/htm/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    var constants_js_1 = require_constants();
    var build_js_1 = require_build();
    var CACHES = /* @__PURE__ */ new Map();
    var regular = function(statics) {
      let tmp = CACHES.get(this);
      if (!tmp) {
        tmp = /* @__PURE__ */ new Map();
        CACHES.set(this, tmp);
      }
      tmp = (0, build_js_1.evaluate)(this, tmp.get(statics) || (tmp.set(statics, tmp = (0, build_js_1.build)(statics)), tmp), arguments, []);
      return tmp.length > 1 ? tmp : tmp[0];
    };
    exports.default = constants_js_1.MINI ? build_js_1.build : regular;
  }
});

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/htm.js
var require_htm2 = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/htm.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : {
        "default": mod
      };
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    var index_js_1 = __importDefault(require_htm());
    exports.default = index_js_1.default;
  }
});

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/jsx.js
var require_jsx = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/jsx.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : {
        "default": mod
      };
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.jsx = void 0;
    var core_js_1 = require_core();
    var htm_js_1 = __importDefault(require_htm2());
    var jsx = htm_js_1.default.bind(core_js_1.h);
    exports.jsx = jsx;
  }
});

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/lazy.js
var require_lazy = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/lazy.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.hydrateLazy = void 0;
    var core_js_1 = require_core();
    var visible_js_1 = require_visible();
    var hydrateLazy = (component, parent = null, removeChildNodes = true) => {
      const c = (0, core_js_1.h)(visible_js_1.Visible, null, component);
      return (0, core_js_1.hydrate)(c, parent, removeChildNodes);
    };
    exports.hydrateLazy = hydrateLazy;
  }
});

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/store.js
var require_store = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/store.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.Store = void 0;
    var core_js_1 = require_core();
    var Store = class {
      /**
         * Create your own Store.
         * @param defaultState Pass the initial State.
         * @param name The name of the Store (only required if you persist the state in localStorage or sessionStorage).
         * @param storage Pass 'memory', 'local' or 'session'.
         */
      constructor(defaultState, name = "", storage = "memory") {
        this._listeners = /* @__PURE__ */ new Map();
        if ((0, core_js_1.isSSR)()) storage = "memory";
        this._id = name;
        this._storage = storage;
        this._state = this._prevState = defaultState;
        if (storage === "memory" || !storage) return;
        const Storage = storage === "local" ? localStorage : sessionStorage;
        const item = Storage.getItem(this._id);
        if (item) {
          this._state = this._prevState = JSON.parse(item);
        } else Storage.setItem(this._id, JSON.stringify(defaultState));
      }
      persist(newState) {
        if (this._storage === "memory") return;
        const Storage = this._storage === "local" ? localStorage : sessionStorage;
        Storage.setItem(this._id, JSON.stringify(newState));
      }
      /** Clears the state of the whole store. */
      clear() {
        this._state = this._prevState = void 0;
        if (this._storage === "local") localStorage.removeItem(this._id);
        else if (this._storage === "session") sessionStorage.removeItem(this._id);
      }
      setState(newState) {
        this.state = newState;
      }
      set state(newState) {
        this._prevState = this._state;
        this._state = newState;
        this.persist(newState);
        this._listeners.forEach((fnc) => {
          fnc(this._state, this._prevState);
        });
      }
      get state() {
        return this._state;
      }
      use() {
        const id = Math.random().toString(36).substring(2, 9);
        const _this = this;
        return {
          get state() {
            return _this.state;
          },
          setState: (newState) => {
            this.state = newState;
          },
          subscribe: (fnc) => {
            this._listeners.set(id, fnc);
          },
          cancel: () => {
            if (this._listeners.has(id)) this._listeners.delete(id);
          }
        };
      }
    };
    exports.Store = Store;
  }
});

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/context.js
var require_context = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/context.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.useContext = exports.createContext = void 0;
    var createContext = (ctx) => {
      let _ctx = ctx;
      return {
        Provider: (props) => {
          if (props.value) _ctx = props.value;
          return props.children;
        },
        Consumer: (props) => {
          return {
            component: props.children[0](_ctx),
            props: {
              ...props,
              context: _ctx
            }
          };
        },
        get: () => _ctx,
        set: (ctx2) => _ctx = ctx2
      };
    };
    exports.createContext = createContext;
    var useContext = (ctx) => {
      const _ctx = ctx;
      if (_ctx && typeof _ctx.get === "function") {
        return _ctx.get();
      }
    };
    exports.useContext = useContext;
  }
});

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/withStyles.js
var require_withStyles = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/withStyles.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.withStyles = void 0;
    var core_js_1 = require_core();
    var component_js_1 = require_component();
    var fragment_js_1 = require_fragment();
    var helmet_js_1 = require_helmet();
    var withStyles = (...styles) => (WrappedComponent) => {
      return class extends component_js_1.Component {
        render() {
          const { children, ...rest } = this.props;
          const helmets = [];
          styles.forEach((style) => {
            var _a;
            if (typeof style === "string") {
              helmets.push((0, core_js_1.h)(helmet_js_1.Helmet, null, (0, core_js_1.h)("style", null, style)));
            } else if (typeof style === "function") {
              const _style = style();
              if (typeof _style === "string") {
                helmets.push((0, core_js_1.h)(helmet_js_1.Helmet, null, (0, core_js_1.h)("style", null, _style)));
              }
            } else if (typeof style === "object") {
              const _style = (_a = style.toString) === null || _a === void 0 ? void 0 : _a.call(style);
              if (typeof _style === "string") {
                helmets.push((0, core_js_1.h)(helmet_js_1.Helmet, null, (0, core_js_1.h)("style", null, _style)));
              }
            }
          });
          const component = children && children.length > 0 ? (0, core_js_1.h)(WrappedComponent, {
            ...rest
          }, children) : (0, core_js_1.h)(WrappedComponent, {
            ...this.props
          });
          return (0, core_js_1.h)(fragment_js_1.Fragment, null, ...helmets, component);
        }
      };
    };
    exports.withStyles = withStyles;
  }
});

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/customElementsMode.js
var require_customElementsMode = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/customElementsMode.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.defineAsCustomElements = void 0;
    var core_js_1 = require_core();
    var defineAsCustomElementsSSR = (component, componentName, _publicProps = [], _options = {}) => {
      if (!/^[a-zA-Z0-9]+-[a-zA-Z0-9]+$/.test(componentName)) console.log(`Error: WebComponent name "${componentName}" is invalid.`);
      else _nano.customElements.set(componentName, component);
    };
    var defineAsCustomElements = function(component, componentName, publicProps, shadow) {
      if ((0, core_js_1.isSSR)()) {
        defineAsCustomElementsSSR(component, componentName, publicProps);
        return;
      }
      customElements.define(componentName, class extends HTMLElement {
        constructor() {
          super();
          if (shadow) {
            this.attachShadow(shadow);
            this.$root = this.shadowRoot;
          } else {
            this.$root = this;
          }
          let ref;
          const el = this.buildEl((0, core_js_1._render)({
            component,
            props: {
              ref: (r) => ref = r,
              children: Array.from(this.children).map((c) => (0, core_js_1.render)(c))
            }
          }));
          this.component = ref;
          this.isFunctionalComponent = !component.isClass;
          this.functionalComponentsProps = {};
          this.appendEl(el);
          if (!this.isFunctionalComponent) {
            this.component.updatePropsValue = (name, value) => {
              if (!this.component.props) this.component.props = {};
              this.component.props[name] = value;
              this.component[name] = value;
            };
          }
        }
        static get observedAttributes() {
          return publicProps;
        }
        buildEl(contents) {
          return (0, core_js_1.h)("template", null, contents);
        }
        appendEl(el) {
          this.$root.append(...el.childNodes);
        }
        removeChildren() {
          var _a;
          if (this.$root) {
            const children = Array.from((_a = this.$root) === null || _a === void 0 ? void 0 : _a.children) || [];
            for (const el of children) {
              el.remove();
            }
          }
        }
        attributeChangedCallback(name, _, newValue) {
          if (!this.isFunctionalComponent) {
            this.component.updatePropsValue(name, newValue);
            this.component.update();
          } else {
            this.removeChildren();
            this.functionalComponentsProps[name] = newValue;
            const el = this.buildEl((0, core_js_1._render)({
              component,
              props: {
                children: [],
                ref: (r) => this.component = r,
                ...this.functionalComponentsProps
              }
            }));
            this.appendEl(el);
          }
        }
      });
    };
    exports.defineAsCustomElements = defineAsCustomElements;
  }
});

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/index.js
var require_lib = __commonJS({
  "../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/lib/index.js"(exports) {
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = {
          enumerable: true,
          get: function() {
            return m[k];
          }
        };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.VERSION = exports.printVersion = exports.defineAsCustomElements = exports.withStyles = exports.useContext = exports.createContext = exports.Store = exports.Fragment = exports.renderSSR = exports.task = exports.nodeToString = exports.hydrateLazy = exports.jsx = exports.isSSR = exports.Component = exports.tick = exports.hydrate = exports.render = exports.h = void 0;
    var core_js_1 = require_core();
    Object.defineProperty(exports, "h", {
      enumerable: true,
      get: function() {
        return core_js_1.h;
      }
    });
    Object.defineProperty(exports, "render", {
      enumerable: true,
      get: function() {
        return core_js_1.render;
      }
    });
    Object.defineProperty(exports, "hydrate", {
      enumerable: true,
      get: function() {
        return core_js_1.hydrate;
      }
    });
    Object.defineProperty(exports, "tick", {
      enumerable: true,
      get: function() {
        return core_js_1.tick;
      }
    });
    var component_js_1 = require_component();
    Object.defineProperty(exports, "Component", {
      enumerable: true,
      get: function() {
        return component_js_1.Component;
      }
    });
    __exportStar(require_components(), exports);
    var core_js_2 = require_core();
    Object.defineProperty(exports, "isSSR", {
      enumerable: true,
      get: function() {
        return core_js_2.isSSR;
      }
    });
    var ssr_js_1 = require_ssr();
    exports.default = {
      h: core_js_2.h,
      render: core_js_2.render,
      hydrate: core_js_2.hydrate,
      renderSSR: ssr_js_1.renderSSR,
      isSSR: core_js_2.isSSR
    };
    var jsx_js_1 = require_jsx();
    Object.defineProperty(exports, "jsx", {
      enumerable: true,
      get: function() {
        return jsx_js_1.jsx;
      }
    });
    var lazy_js_1 = require_lazy();
    Object.defineProperty(exports, "hydrateLazy", {
      enumerable: true,
      get: function() {
        return lazy_js_1.hydrateLazy;
      }
    });
    var helpers_js_1 = require_helpers();
    Object.defineProperty(exports, "nodeToString", {
      enumerable: true,
      get: function() {
        return helpers_js_1.nodeToString;
      }
    });
    Object.defineProperty(exports, "task", {
      enumerable: true,
      get: function() {
        return helpers_js_1.task;
      }
    });
    var ssr_js_2 = require_ssr();
    Object.defineProperty(exports, "renderSSR", {
      enumerable: true,
      get: function() {
        return ssr_js_2.renderSSR;
      }
    });
    var fragment_js_1 = require_fragment();
    Object.defineProperty(exports, "Fragment", {
      enumerable: true,
      get: function() {
        return fragment_js_1.Fragment;
      }
    });
    var store_js_1 = require_store();
    Object.defineProperty(exports, "Store", {
      enumerable: true,
      get: function() {
        return store_js_1.Store;
      }
    });
    var context_js_1 = require_context();
    Object.defineProperty(exports, "createContext", {
      enumerable: true,
      get: function() {
        return context_js_1.createContext;
      }
    });
    Object.defineProperty(exports, "useContext", {
      enumerable: true,
      get: function() {
        return context_js_1.useContext;
      }
    });
    var withStyles_js_1 = require_withStyles();
    Object.defineProperty(exports, "withStyles", {
      enumerable: true,
      get: function() {
        return withStyles_js_1.withStyles;
      }
    });
    var customElementsMode_js_1 = require_customElementsMode();
    Object.defineProperty(exports, "defineAsCustomElements", {
      enumerable: true,
      get: function() {
        return customElementsMode_js_1.defineAsCustomElements;
      }
    });
    var helpers_js_2 = require_helpers();
    Object.defineProperty(exports, "printVersion", {
      enumerable: true,
      get: function() {
        return helpers_js_2.printVersion;
      }
    });
    var version_js_1 = require_version();
    Object.defineProperty(exports, "VERSION", {
      enumerable: true,
      get: function() {
        return version_js_1.VERSION;
      }
    });
  }
});
export default require_lib();
