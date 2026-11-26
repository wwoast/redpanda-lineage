var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/esm/core.js
var isSSR = () => typeof _nano !== "undefined" && _nano.isSSR === true;
var tick = Promise.prototype.then.bind(Promise.resolve());
var removeAllChildNodes = (parent) => {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
};
var strToHash = (s) => {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const chr = s.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(32);
};
var appendChildren = (element, children, escape = true) => {
  if (!Array.isArray(children)) {
    appendChildren(element, [children], escape);
    return;
  }
  if (typeof children === "object")
    children = Array.prototype.slice.call(children);
  children.forEach((child) => {
    if (Array.isArray(child))
      appendChildren(element, child, escape);
    else {
      const c = _render(child);
      if (typeof c !== "undefined") {
        if (Array.isArray(c))
          appendChildren(element, c, escape);
        else {
          if (isSSR() && !escape)
            element.appendChild(c.nodeType == null ? c.toString() : c);
          else
            element.appendChild(c.nodeType == null ? document.createTextNode(c.toString()) : c);
        }
      }
    }
  });
};
var SVG = (props) => {
  const child = props.children[0];
  const attrs = child.attributes;
  if (isSSR())
    return child;
  const svg = hNS("svg");
  for (let i = attrs.length - 1; i >= 0; i--) {
    svg.setAttribute(attrs[i].name, attrs[i].value);
  }
  svg.innerHTML = child.innerHTML;
  return svg;
};
var render = (component, parent = null, removeChildNodes = true) => {
  let el = _render(component);
  if (Array.isArray(el)) {
    el = el.map((e) => _render(e));
    if (el.length === 1)
      el = el[0];
  }
  if (parent) {
    if (removeChildNodes)
      removeAllChildNodes(parent);
    if (el && parent.id && parent.id === el.id && parent.parentElement) {
      parent.parentElement.replaceChild(el, parent);
    } else {
      if (Array.isArray(el))
        el.forEach((e) => {
          appendChildren(parent, _render(e));
        });
      else
        appendChildren(parent, _render(el));
    }
    return parent;
  } else {
    if (isSSR() && !Array.isArray(el))
      return [el];
    return el;
  }
};
var hydrate = render;
var _render = (comp) => {
  if (comp === null || comp === false || typeof comp === "undefined")
    return [];
  if (typeof comp === "string" || typeof comp === "number")
    return comp.toString();
  if (comp.tagName && comp.tagName.toLowerCase() === "svg")
    return SVG({ children: [comp] });
  if (comp.tagName)
    return comp;
  if (comp && comp.nodeType === 3)
    return comp;
  if (comp && comp.component && comp.component.isClass)
    return renderClassComponent(comp);
  if (comp.isClass)
    return renderClassComponent({ component: comp, props: {} });
  if (comp.component && typeof comp.component === "function")
    return renderFunctionalComponent(comp);
  if (Array.isArray(comp))
    return comp.map((c) => _render(c)).flat();
  if (typeof comp === "function" && !comp.isClass)
    return _render(comp());
  if (comp.component && comp.component.tagName && typeof comp.component.tagName === "string")
    return _render(comp.component);
  if (Array.isArray(comp.component))
    return _render(comp.component);
  if (comp.component)
    return _render(comp.component);
  if (typeof comp === "object")
    return [];
  console.warn("Something unexpected happened with:", comp);
};
var renderFunctionalComponent = (fncComp) => {
  const { component, props } = fncComp;
  return _render(component(props));
};
var renderClassComponent = (classComp) => {
  const { component, props } = classComp;
  const hash = strToHash(component.toString());
  component.prototype._getHash = () => hash;
  const Component2 = new component(props);
  if (!isSSR())
    Component2.willMount();
  let el = Component2.render();
  el = _render(el);
  Component2.elements = el;
  if (props && props.ref)
    props.ref(Component2);
  if (!isSSR())
    tick(() => {
      Component2._didMount();
    });
  return el;
};
var hNS = (tag) => document.createElementNS("http://www.w3.org/2000/svg", tag);
var h = (tagNameOrComponent, props = {}, ...children) => {
  if (props && props.children) {
    if (Array.isArray(children)) {
      if (Array.isArray(props.children))
        children = [...props.children, ...children];
      else
        children.push(props.children);
    } else {
      if (Array.isArray(props.children))
        children = props.children;
      else
        children = [props.children];
    }
  }
  if (isSSR() && _nano.ssrTricks.isWebComponent(tagNameOrComponent)) {
    const element2 = _nano.ssrTricks.renderWebComponent(tagNameOrComponent, props, children, _render);
    if (element2 === null)
      return `ERROR: "<${tagNameOrComponent} />"`;
    else
      return element2;
  }
  if (typeof tagNameOrComponent !== "string")
    return { component: tagNameOrComponent, props: { ...props, children } };
  try {
    if (isSSR() && typeof tagNameOrComponent === "string" && !document)
      throw new Error("document is not defined");
  } catch (err) {
    console.log("ERROR:", err.message, "\n > Please read: https://github.com/nanojsx/nano/issues/106");
  }
  let ref;
  const element = tagNameOrComponent === "svg" ? hNS("svg") : document.createElement(tagNameOrComponent);
  const isEvent = (el, p) => {
    if (0 !== p.indexOf("on"))
      return false;
    if (el._ssr)
      return true;
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
    if (p === "ref")
      ref = props[p];
    else if (isEvent(element, p.toLowerCase()))
      element.addEventListener(p.toLowerCase().substring(2), (e) => props[p](e));
    else if (p === "dangerouslySetInnerHTML" && props[p].__html) {
      if (!isSSR()) {
        const fragment = document.createElement("fragment");
        fragment.innerHTML = props[p].__html;
        element.appendChild(fragment);
      } else {
        element.innerHTML = props[p].__html;
      }
    } else if (p === "innerHTML" && props[p].__dangerousHtml) {
      if (!isSSR()) {
        const fragment = document.createElement("fragment");
        fragment.innerHTML = props[p].__dangerousHtml;
        element.appendChild(fragment);
      } else {
        element.innerHTML = props[p].__dangerousHtml;
      }
    } else if (/^className$/i.test(p))
      element.setAttribute("class", props[p]);
    else if (typeof props[p] !== "undefined")
      element.setAttribute(p, props[p]);
  }
  const escape = !["noscript", "script", "style"].includes(tagNameOrComponent);
  appendChildren(element, children, escape);
  if (ref)
    ref(element);
  return element;
};

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/esm/version.js
var VERSION = "0.2.1";

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/esm/helpers.js
var task = (task2) => setTimeout(task2, 0);
var nodeToString = (node) => {
  const tmpNode = document.createElement("div");
  tmpNode.appendChild(node.cloneNode(true));
  return tmpNode.innerHTML;
};
var detectSSR = () => {
  const isDeno = typeof Deno !== "undefined";
  const hasWindow = typeof window !== "undefined" ? true : false;
  return typeof _nano !== "undefined" && _nano.isSSR || isDeno || !hasWindow;
};
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
var escapeHtml = (unsafe) => {
  if (unsafe && typeof unsafe === "string")
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  return unsafe;
};
var printVersion = () => {
  const info = `Powered by nano JSX v${VERSION}`;
  console.log(`%c %c %c %c %c ${info} %c http://nanojsx.io`, "background: #ff0000", "background: #ffff00", "background: #00ff00", "background: #00ffff", "color: #fff; background: #000000;", "background: none");
};

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/esm/state.js
var _state = /* @__PURE__ */ new Map();

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/esm/component.js
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
    if (isObject && this.state !== void 0)
      this.state = { ...this.state, ...state };
    else
      this.state = state;
    if (shouldUpdate)
      this.update();
  }
  set state(state) {
    _state.set(this.id, state);
  }
  get state() {
    return _state.get(this.id);
  }
  set initState(state) {
    if (this.state === void 0)
      this.state = state;
  }
  /** Returns all currently rendered node elements */
  get elements() {
    return this._elements || [];
  }
  set elements(elements) {
    if (!Array.isArray(elements))
      elements = [elements];
    elements.forEach((element) => {
      this._elements.push(element);
    });
  }
  _addNodeRemoveListener() {
    if (/^[^{]+{\s+}$/gm.test(this.didUnmount.toString()))
      return;
    onNodeRemove(this.elements[0], () => {
      if (!this._skipUnmount)
        this._didUnmount();
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
    if (this._hasUnmounted)
      return;
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
    const oldElements = [...this.elements];
    this._elements = [];
    let el = this.render(update);
    el = _render(el);
    this.elements = el;
    const parent = oldElements[0].parentNode;
    if (!parent)
      console.warn("Component needs a parent element to get updated!");
    this.elements.forEach((child) => {
      if (parent)
        parent.insertBefore(child, oldElements[0]);
    });
    oldElements.forEach((child) => {
      if (!this.elements.includes(child)) {
        child.remove();
        child = null;
      }
    });
    this._addNodeRemoveListener();
    tick(() => {
      this._skipUnmount = false;
      if (!this.elements[0].isConnected)
        this._didUnmount();
      else
        this._didUpdate();
    });
  }
  _getHash() {
  }
};

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/esm/components/helmet.js
var Attributes = class extends Map {
  toString() {
    let string = "";
    for (const [key, value] of this)
      string += ` ${key}="${value}"`;
    return string.trim();
  }
};
var Helmet = class extends Component {
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
      (_a = body.match(regHTML)) === null || _a === void 0 ? void 0 : _a.forEach((h2) => {
        second = second.replace(h2, "");
        while ((res = regAttr.exec(h2)) !== null) {
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
      if (toHead && !head.includes(second))
        head.push(second);
      else if (!toHead && !footer.includes(second))
        footer.push(second);
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
      if (!(element instanceof HTMLElement))
        return;
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
          const titleTag = h("title", null, element.innerHTML);
          appendChildren(parent, [titleTag], false);
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
        if (attrs.length > 0 && attrs2.length > 0 && JSON.stringify(attrs) === JSON.stringify(attrs2))
          exists = true;
      }
      if (!exists)
        appendChildren(parent, [element], false);
    });
  }
  render() {
    const placement = this.props.footer ? "footer" : "head";
    if (isSSR())
      return h("helmet", { "data-ssr": true, "data-placement": placement }, this.props.children);
    else
      return [];
  }
};

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/esm/components/img.js
var Img = class extends Component {
  constructor(props) {
    super(props);
    const { src, key } = props;
    this.id = `${strToHash(src)}-${strToHash(JSON.stringify(props))}`;
    if (key)
      this.id += `key-${key}`;
    if (!this.state)
      this.setState({ isLoaded: false, image: void 0 });
  }
  didMount() {
    const { lazy = true, placeholder, children, key, ref, ...rest } = this.props;
    if (typeof lazy === "boolean" && lazy === false)
      return;
    const observer = new IntersectionObserver((entries, observer2) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          observer2.disconnect();
          this.state.image = h("img", { ...rest });
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
    }, { threshold: [0, 1] });
    observer.observe(this.elements[0]);
  }
  render() {
    const { src, placeholder, children, lazy = true, key, ref, ...rest } = this.props;
    if (typeof lazy === "boolean" && lazy === false) {
      this.state.image = h("img", { src, ...rest });
      return this.state.image;
    }
    if (this.state.isLoaded) {
      return this.state.image;
    } else if (placeholder && typeof placeholder === "string") {
      return h("img", { src: placeholder, ...rest });
    } else if (placeholder && typeof placeholder === "function") {
      return placeholder();
    } else {
      const style = {};
      if (rest.width)
        style.width = `${rest.width}px`;
      if (rest.height)
        style.height = `${rest.height}px`;
      const { width, height, ...others } = rest;
      return h("div", { style, ...others });
    }
  }
};

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/esm/fragment.js
var Fragment = (props) => {
  return props.children;
};

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/esm/components/link.js
var Link = class extends Component {
  prefetchOnHover() {
    this.elements[0].addEventListener("mouseover", () => this.addPrefetch(), { once: true });
  }
  prefetchOnVisible() {
    const observer = new IntersectionObserver((entries, observer2) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          observer2.disconnect();
          this.addPrefetch();
        }
      });
    }, { threshold: [0, 1] });
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
      const prefetch = h("link", { rel: "prefetch", href: this.props.href, as: "document" });
      document.head.appendChild(prefetch);
    }
  }
  didMount() {
    const { href, prefetch, delay = 0, back = false } = this.props;
    if (back)
      this.elements[0].addEventListener("click", (e) => {
        e.preventDefault();
        const target = e.target;
        if (target.href === document.referrer)
          window.history.back();
        else
          window.location.href = target.href;
      });
    if (delay > 0)
      this.elements[0].addEventListener("click", (e) => {
        e.preventDefault();
        setTimeout(() => window.location.href = href, delay);
      });
    if (prefetch) {
      if (prefetch === "hover")
        this.prefetchOnHover();
      else if (prefetch === "visible")
        this.prefetchOnVisible();
      else
        this.addPrefetch();
    }
  }
  render() {
    const { children, prefetch, back, ref, ...rest } = this.props;
    if (!this.props.href)
      console.warn('Please add "href" to <Link>');
    if (children.length !== 1)
      console.warn("Please add ONE child to <Link> (<Link>child</Link>)");
    const a = h("a", { ...rest }, ...children);
    if (prefetch === true && !(typeof window !== "undefined" && window.document)) {
      const link = h("link", { rel: "prefetch", href: this.props.href, as: "document" });
      const helmet = h(Helmet, null, link);
      return h(Fragment, null, [helmet, a]);
    } else {
      return a;
    }
  }
};

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/esm/components/router.js
var router_exports = {};
__export(router_exports, {
  Link: () => Link2,
  Listener: () => Listener,
  Route: () => Route,
  Routes: () => Routes,
  Switch: () => Switch,
  matchPath: () => matchPath,
  parseParamsFromPath: () => parseParamsFromPath,
  to: () => to
});
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
          if (!regexMatch)
            return null;
        }
        params = { ...params, [key]: value };
        pathArr[i] = pathnameArr[i];
      }
    });
    path = pathArr.join("/");
  }
  if (path === "*")
    match = [pathname];
  if (!match)
    match = new RegExp(`^${path}`).exec(pathname);
  if (!match)
    return null;
  const url = match[0];
  const isExact = pathname === url;
  if (exact && !isExact)
    return null;
  return {
    path,
    url,
    isExact,
    params
  };
};
var Switch = class extends Component {
  constructor() {
    super(...arguments);
    this.index = 0;
    this.path = "";
    this.match = { index: -1, path: "" };
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
    if (this.shouldUpdate())
      this.update();
  }
  findChild() {
    this.match = { index: -1, path: "" };
    this.props.children = this.props.children.flat();
    for (let i = 0; i < this.props.children.length; i++) {
      const child = this.props.children[i];
      const { path, exact, regex } = child.props;
      const match = matchPath(isSSR() ? _nano.location.pathname : window.location.pathname, {
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
      const el = _render(child);
      return h("div", {}, _render(el));
    } else if (this.props.fallback) {
      return h("div", {}, _render(this.props.fallback));
    } else {
      return h("div", {}, "not found");
    }
  }
};
var Routes = class extends Switch {
};
var Route = ({ path, regex, children }) => {
  const pathname = isSSR() ? _nano.location.pathname : window.location.pathname;
  const params = parseParamsFromPath(path);
  children.forEach((child) => {
    if (child.props)
      child.props = { ...child.props, route: { path, regex, pathname, params } };
  });
  return children;
};
var to = (to2, replace = false) => {
  replace ? historyReplace(to2) : historyPush(to2);
};
var Link2 = ({ to: to2, replace, children, ...rest }) => {
  const handleClick = (event) => {
    event.preventDefault();
    replace ? historyReplace(to2) : historyPush(to2);
  };
  return h("a", { href: to2, onClick: (e) => handleClick(e), ...rest }, children);
};
var CListener = class {
  constructor() {
    this._listeners = /* @__PURE__ */ new Map();
    if (isSSR())
      return;
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
        if (this._listeners.has(id))
          this._listeners.delete(id);
      }
    };
  }
};
var listener;
var Listener = () => {
  if (!listener)
    listener = new CListener();
  return listener;
};
var parseParamsFromPath = (path) => {
  let params = {};
  const _pathname = isSSR() ? _nano.location.pathname.split("/") : window.location.pathname.split("/");
  path.split("/").forEach((p, i) => {
    if (p.startsWith(":"))
      params = { ...params, [p.slice(1)]: _pathname[i] };
  });
  return params;
};

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/esm/components/suspense.js
var Suspense = class extends Component {
  constructor(props) {
    super(props);
    this.ready = false;
    const { children, fallback, cache = false, ...rest } = this.props;
    const str = JSON.stringify(rest, function(_key, val) {
      if (typeof val === "function")
        return `${val}`;
      return val;
    });
    this.id = strToHash(JSON.stringify(str));
  }
  async didMount() {
    const { children, fallback, cache = false, ...rest } = this.props;
    if (cache)
      this.initState = {};
    if (this.loadFromCache(cache))
      return;
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
      if (cache)
        this.state = { ...this.state, [item]: fnc[index] };
      return {
        ...obj,
        [item]: fnc[index]
      };
    }, {});
    return data;
  }
  addDataToChildren(data) {
    this.props.children.forEach((child) => {
      if (child.props)
        child.props = { ...child.props, ...data };
    });
  }
  render() {
    if (!isSSR()) {
      const { cache = false } = this.props;
      this.loadFromCache(cache);
      return !this.ready ? this.props.fallback : this.props.children;
    } else {
      this.ssr();
      return this.props.children;
    }
  }
};

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/esm/components/visible.js
var Visible = class extends Component {
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
    }, { threshold: [0, 1] });
    observer.observe(this.elements[0]);
  }
  render() {
    if (!this.isVisible) {
      return h("div", { "data-visible": false, visibility: "hidden" });
    } else {
      if (this.props.onVisible)
        this.props.onVisible();
      return render(this.props.component || this.props.children[0]);
    }
  }
};

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/esm/regexDom.js
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
    const replacer = (_match, p1, _p2, p3) => [p1, text, p3].join("");
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
          if (classes && classes[2])
            return classes[2].split(" ").length;
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
    const replacer1 = (_match, p1, p2) => `${p1}${escapeHtml(name)}="${escapeHtml(value)}" ${p2}`;
    const replacer2 = (_match, p1, p2) => `${p1} ${escapeHtml(name)}="${escapeHtml(value)}"${p2}`;
    if (this.isSelfClosing)
      this._ssr = this._ssr.replace(/(^<[a-z0-9]+ )(.+)/gm, replacer1);
    else
      this._ssr = this._ssr.replace(/(^<[^>]+)(.+)/gm, replacer2);
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
    return escapeHtml(text);
  }
  querySelector(_query) {
    return void 0;
  }
};
var documentSSR = () => {
  return new DocumentSSR();
};

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/esm/ssr.js
var ssrTricks = {
  isWebComponent: (tagNameOrComponent) => {
    return typeof tagNameOrComponent === "string" && tagNameOrComponent.includes("-") && _nano.customElements.has(tagNameOrComponent);
  },
  renderWebComponent: (tagNameOrComponent, props, children, _render2) => {
    const customElement = _nano.customElements.get(tagNameOrComponent);
    const component = _render2({ component: customElement, props: { ...props, children } });
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
  const isSSR2 = detectSSR() === true ? true : void 0;
  const location = { pathname: "/" };
  const document2 = isSSR2 ? documentSSR() : window.document;
  globalThis._nano = { isSSR: isSSR2, location, document: document2, customElements: /* @__PURE__ */ new Map(), ssrTricks };
};
initGlobalVar();
var initSSR = (pathname = "/") => {
  _nano.location = { pathname };
  globalThis.document = _nano.document = isSSR() ? documentSSR() : window.document;
};
var renderSSR = (component, options = {}) => {
  const { pathname, clearState = true } = options;
  initSSR(pathname);
  if (clearState)
    _state.clear();
  const tmp = render(component, null, true);
  if (Array.isArray(tmp))
    return tmp.join("");
  else
    return Array.from(tmp).join("");
};

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/esm/htm/constants.js
var MINI = false;

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/esm/htm/build.js
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
var evaluate = (h2, built, fields, args) => {
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
      tmp = h2.apply(value, evaluate(h2, value, fields, ["", null]));
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
var build = function(statics, ...rest) {
  const fields = [statics, ...rest];
  const h2 = this;
  let mode = MODE_TEXT;
  let buffer = "";
  let quote = "";
  let current = [0];
  let char;
  let propName;
  const commit = (field) => {
    if (mode === MODE_TEXT && (field || (buffer = buffer.replace(/^\s*\n\s*|\s*\n\s*$/g, "")))) {
      if (MINI) {
        current.push(field ? fields[field] : buffer);
      } else {
        current.push(CHILD_APPEND, field, buffer);
      }
    } else if (mode === MODE_TAGNAME && (field || buffer)) {
      if (MINI) {
        current[1] = field ? fields[field] : buffer;
      } else {
        current.push(TAG_SET, field, buffer);
      }
      mode = MODE_WHITESPACE;
    } else if (mode === MODE_WHITESPACE && buffer === "..." && field) {
      if (MINI) {
        current[2] = Object.assign(current[2] || {}, fields[field]);
      } else {
        current.push(PROPS_ASSIGN, field, 0);
      }
    } else if (mode === MODE_WHITESPACE && buffer && !field) {
      if (MINI) {
        ;
        (current[2] = current[2] || {})[buffer] = true;
      } else {
        current.push(PROP_SET, 0, true, buffer);
      }
    } else if (mode >= MODE_PROP_SET) {
      if (MINI) {
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
          if (MINI) {
            current = [current, "", null];
          } else {
            current = [current];
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
        if (MINI) {
          ;
          (current = current[0]).push(h2(...mode.slice(1)));
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
  if (MINI) {
    return current.length > 2 ? current.slice(1) : current[1];
  }
  return current;
};

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/esm/htm/index.js
var CACHES = /* @__PURE__ */ new Map();
var regular = function(statics) {
  let tmp = CACHES.get(this);
  if (!tmp) {
    tmp = /* @__PURE__ */ new Map();
    CACHES.set(this, tmp);
  }
  tmp = evaluate(this, tmp.get(statics) || (tmp.set(statics, tmp = build(statics)), tmp), arguments, []);
  return tmp.length > 1 ? tmp : tmp[0];
};
var htm_default = MINI ? build : regular;

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/esm/htm.js
var htm_default2 = htm_default;

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/esm/jsx.js
var jsx = htm_default2.bind(h);

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/esm/lazy.js
var hydrateLazy = (component, parent = null, removeChildNodes = true) => {
  const c = h(Visible, null, component);
  return hydrate(c, parent, removeChildNodes);
};

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/esm/store.js
var Store = class {
  /**
   * Create your own Store.
   * @param defaultState Pass the initial State.
   * @param name The name of the Store (only required if you persist the state in localStorage or sessionStorage).
   * @param storage Pass 'memory', 'local' or 'session'.
   */
  constructor(defaultState, name = "", storage = "memory") {
    this._listeners = /* @__PURE__ */ new Map();
    if (isSSR())
      storage = "memory";
    this._id = name;
    this._storage = storage;
    this._state = this._prevState = defaultState;
    if (storage === "memory" || !storage)
      return;
    const Storage = storage === "local" ? localStorage : sessionStorage;
    const item = Storage.getItem(this._id);
    if (item) {
      this._state = this._prevState = JSON.parse(item);
    } else
      Storage.setItem(this._id, JSON.stringify(defaultState));
  }
  persist(newState) {
    if (this._storage === "memory")
      return;
    const Storage = this._storage === "local" ? localStorage : sessionStorage;
    Storage.setItem(this._id, JSON.stringify(newState));
  }
  /** Clears the state of the whole store. */
  clear() {
    this._state = this._prevState = void 0;
    if (this._storage === "local")
      localStorage.removeItem(this._id);
    else if (this._storage === "session")
      sessionStorage.removeItem(this._id);
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
        if (this._listeners.has(id))
          this._listeners.delete(id);
      }
    };
  }
};

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/esm/context.js
var createContext = (ctx) => {
  let _ctx = ctx;
  return {
    Provider: (props) => {
      if (props.value)
        _ctx = props.value;
      return props.children;
    },
    Consumer: (props) => {
      return { component: props.children[0](_ctx), props: { ...props, context: _ctx } };
    },
    get: () => _ctx,
    set: (ctx2) => _ctx = ctx2
  };
};
var useContext = (ctx) => {
  const _ctx = ctx;
  if (_ctx && typeof _ctx.get === "function") {
    return _ctx.get();
  }
};

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/esm/withStyles.js
var withStyles = (...styles) => (WrappedComponent) => {
  return class extends Component {
    render() {
      const { children, ...rest } = this.props;
      const helmets = [];
      styles.forEach((style) => {
        var _a;
        if (typeof style === "string") {
          helmets.push(h(Helmet, null, h("style", null, style)));
        } else if (typeof style === "function") {
          const _style = style();
          if (typeof _style === "string") {
            helmets.push(h(Helmet, null, h("style", null, _style)));
          }
        } else if (typeof style === "object") {
          const _style = (_a = style.toString) === null || _a === void 0 ? void 0 : _a.call(style);
          if (typeof _style === "string") {
            helmets.push(h(Helmet, null, h("style", null, _style)));
          }
        }
      });
      const component = children && children.length > 0 ? h(WrappedComponent, { ...rest }, children) : h(WrappedComponent, { ...this.props });
      return h(Fragment, null, ...helmets, component);
    }
  };
};

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/esm/customElementsMode.js
var defineAsCustomElementsSSR = (component, componentName, _publicProps = [], _options = {}) => {
  if (!/^[a-zA-Z0-9]+-[a-zA-Z0-9]+$/.test(componentName))
    console.log(`Error: WebComponent name "${componentName}" is invalid.`);
  else
    _nano.customElements.set(componentName, component);
};
var defineAsCustomElements = function(component, componentName, publicProps, shadow) {
  if (isSSR()) {
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
      const el = this.buildEl(_render({
        component,
        props: {
          ref: (r) => ref = r,
          children: Array.from(this.children).map((c) => render(c))
        }
      }));
      this.component = ref;
      this.isFunctionalComponent = !component.isClass;
      this.functionalComponentsProps = {};
      this.appendEl(el);
      if (!this.isFunctionalComponent) {
        this.component.updatePropsValue = (name, value) => {
          if (!this.component.props)
            this.component.props = {};
          this.component.props[name] = value;
          this.component[name] = value;
        };
      }
    }
    static get observedAttributes() {
      return publicProps;
    }
    buildEl(contents) {
      return h("template", null, contents);
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
        const el = this.buildEl(_render({
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

// ../../../.cache/deno/npm/registry.npmjs.org/nano-jsx/0.2.1/esm/index.js
var index_default = { h, render, hydrate, renderSSR, isSSR };
export {
  Component,
  Fragment,
  Helmet,
  Img,
  Link,
  router_exports as Router,
  Store,
  Suspense,
  VERSION,
  Visible,
  createContext,
  index_default as default,
  defineAsCustomElements,
  h,
  hydrate,
  hydrateLazy,
  isSSR,
  jsx,
  nodeToString,
  printVersion,
  render,
  renderSSR,
  task,
  tick,
  useContext,
  withStyles
};
