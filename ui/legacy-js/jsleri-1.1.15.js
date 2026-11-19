/* global process */

/*
 *  JS-Leri - JavaScript LR-Parsing Module $VERSION$
 *
 *  Another parser module which allows writing the language in plain JavaScript.
 *  This project was inspired by lrparsing (http://lrparsing.sourceforge.net/), a Python
 *  parser written by Russell Stuart, 2014-05-29.
 *
 *  copyright 2015, Jeroen van der Heijden (Cesbit)
 */

var version = '1.1.15'

// dummy function which can be used as alternative for onEnter and onExit methods
var noop = function () {};

var RE_LEFT_WHITESPACE = /^\s+/;
var RE_KEYWORDS = /^\w+/;
var RE_WHITESPACE = /\s+/;

var isFunction = function (obj) {
    return typeof obj === 'function';
};

var buildReKeywords = function (re) {
    if (typeof re === 'string' && re.indexOf('^', 0) !== 0) {
        re = '^' + re;
    }
    return new RegExp(re);
};

var sortOnStrLen = function (a, b) {
    return a.length < b.length;
};

var parse = function (element, str, tree, reKeywords) {
    // expecting instance, used for returning feedback when statement is invalid
    var expecting = new Expecting();

    // used to add a node to the tree
    var appendTree = function (tree, node, pos) {
        if (pos > expecting.pos) {
            expecting.empty();
        }
        node.end = pos;
        node.str = str.substring(node.start, node.end);
        tree.push(node);
    };

    // recursive function to 'walk' through the tree
    var walk = function (element, pos, tree, rule, isRequired) {

        var s,
            isValid,
            nodeRes,
            i,
            l,
            reMatch,
            children,
            node,
            mostGreedy;

        s = str.substring(pos).replace(RE_LEFT_WHITESPACE, '');

        node = new Node(element, str.length - s.length);

        expecting.setModeRequired(node.start, isRequired);

        /**************************************************************************
         * Choice
         **************************************************************************/
        if (element instanceof Choice) {
            mostGreedy = new NodeResult(false, node.start);

            for (i = 0, l = element.elements.length; i < l; i++) {
                children = [];
                nodeRes = walk(element.elements[i], node.start, children, rule, true);

                if (nodeRes.isValid && nodeRes.pos > mostGreedy.pos) {
                    node.children = children;
                    mostGreedy = nodeRes;
                }
            }
            if (mostGreedy.isValid)
                appendTree(tree, node, mostGreedy.pos);
            return mostGreedy;
        }

        /**************************************************************************
         * Keyword
         **************************************************************************/
        if (element instanceof Keyword) {
            reMatch = s.match(reKeywords);
            isValid = element.ignCase ?
                Boolean( reMatch && reMatch[0].toLowerCase() === element.keyword.toLowerCase() ) :
                Boolean( reMatch && reMatch[0] === element.keyword );
            if (isValid)
                appendTree(tree, node, node.start + element.keyword.length);
            else
                expecting.update(element, node.start);
            return new NodeResult(isValid, node.end || node.start);
        }

        /**************************************************************************
         * List
         **************************************************************************/
        if (element instanceof List) {
            pos = node.start;
            for (i = 0, l = 0;;) {

                nodeRes = walk(element.element, pos, node.children, rule, i < element.min);
                if (!nodeRes.isValid)
                    break;
                pos = nodeRes.pos;
                i++;

                nodeRes = walk(element.delimiter, pos, node.children, rule, i < element.min);
                if (!nodeRes.isValid)
                    break;
                pos = nodeRes.pos;
                l++;
            }
            isValid = (!(i < element.min || (element.max && i > element.max) || (!element.opt && i && i == l)));
            if (isValid)
                appendTree(tree, node, pos);
            return new NodeResult(isValid, pos);
        }

        /**************************************************************************
         * Optional
         **************************************************************************/
        if (element instanceof Optional) {
            nodeRes = walk(element.element, node.start, node.children, rule, false);
            if (nodeRes.isValid)
                appendTree(tree, node, nodeRes.pos);
            return new NodeResult(true, node.end || node.start);
        }

        /**************************************************************************
         * Prio
         **************************************************************************/
        if (element instanceof Prio) {
            if (rule._tested[node.start] === undefined) {
                rule._tested[node.start] = new NodeResult(false, node.start);
            }
            for (i = 0, l = element.elements.length; i < l; i++) {
                children = [];
                nodeRes = walk(element.elements[i], node.start, children, rule, true);

                if (nodeRes.isValid && nodeRes.pos > rule._tested[node.start].pos) {
                    node.children = children;
                    rule._tested[node.start] = nodeRes;
                    rule._tree[node.start] = children;
                }
            }
            if (rule._tested[node.start].isValid)
                appendTree(tree, node, rule._tested[node.start].pos);
            return rule._tested[node.start];
        }

        /**************************************************************************
         * Regex
         **************************************************************************/
        if (element instanceof Regex) {
            reMatch = s.match(element._re);
            isValid = Boolean(reMatch);

            if (isValid)
                appendTree(tree, node, node.start + reMatch[0].length);
            else
                expecting.update(element, node.start);
            return new NodeResult(isValid, node.end || node.start);
        }

        /**************************************************************************
         * Repeat
         **************************************************************************/
        if (element instanceof Repeat) {
            pos = node.start;
            for (i = 0;!element.max || i < element.max;i++) {
                nodeRes = walk(element.element, pos, node.children, rule, i < element.min);
                if (!nodeRes.isValid)
                    break;
                pos = nodeRes.pos;
            }
            isValid = (i >= element.min);
            if (isValid)
                appendTree(tree, node, pos);
            return new NodeResult(isValid, pos);
        }

        /**************************************************************************
         * Rule
         **************************************************************************/
        if (element instanceof Rule) {
            element._tested = {};
            element._tree = {};
            nodeRes = walk(element.element, node.start, node.children, element, true);
            if (nodeRes.isValid)
                appendTree(tree, node, nodeRes.pos);
            return nodeRes;
        }

        /**************************************************************************
         * Sequence
         **************************************************************************/
        if (element instanceof Sequence) {

            pos = node.start;
            for (i = 0, l = element.elements.length; i < l; i++) {
                nodeRes = walk(element.elements[i], pos, node.children, rule, true);
                if (nodeRes.isValid)
                    pos = nodeRes.pos;
                else
                    return nodeRes;
            }
            appendTree(tree, node, nodeRes.pos);
            return nodeRes;
        }

        /**************************************************************************
         * Token
         **************************************************************************/
        if (element instanceof Token) {
            isValid = Boolean(s.indexOf(element.token) === 0);

            if (isValid)
                appendTree(tree, node, node.start + element.token.length);
            else
                expecting.update(element, node.start);
            return new NodeResult(isValid, node.end || node.start);
        }

        /**************************************************************************
         * Tokens
         **************************************************************************/
        if (element instanceof Tokens) {
            for (i = 0, l = element.tokens.length; i < l; i++) {
                if (s.indexOf(element.tokens[i]) === 0) {
                    appendTree(tree, node, node.start + element.tokens[i].length);
                    return new NodeResult(true, node.end);
                }
            }
            expecting.update(element, node.start);
            return new NodeResult(false, node.start);
        }

        /**************************************************************************
         * This
         **************************************************************************/
        if (element instanceof This) {
            if (rule._tested[node.start] === undefined) {
                rule._tested[node.start] = walk(rule.element, node.start, node.children, rule, true);
                rule._tree[node.start] = node.children;
            } else {
                node.children = rule._tree[node.start];
            }
            if (rule._tested[node.start].isValid)
                appendTree(tree, node, rule._tested[node.start].pos);
            return rule._tested[node.start];
        }

    };

    // start walking the tree
    var nodeRes = walk(element, 0, tree, element, true);

    // get rest if anything
    var rest = str.substring(nodeRes.pos).replace(RE_LEFT_WHITESPACE, '');

    // set isValid to False if we have 'rest' left.
    if (nodeRes.isValid && rest) nodeRes.isValid = false;

    // add EndOfStatement to expecting if this is possible
    if (!expecting.required.length && rest) {
        expecting.setModeRequired(nodeRes.pos, true);
        expecting.update(EOS, nodeRes.pos);
    }

    nodeRes.expecting = expecting.getExpecting();

    // add expecting and correct pos to nodeRes if nodeRes is not valid
    if (!nodeRes.isValid)
        nodeRes.pos = expecting.pos;

    // return nodeRes
    return nodeRes;
};

/**************************************************************************
 * Choice constructor
 **************************************************************************/
function Choice () {
    var obj = Jsleri.call(this, Choice, arguments);
    if (obj) return obj;

    this.elements = this.checkElements(this.args);
}
Choice.prototype = Object.create(Jsleri.prototype);
Choice.prototype.constructor = Choice;

/**************************************************************************
 * Keyword constructor
 **************************************************************************/
function Keyword (keyword, ignCase) {
    var obj = Jsleri.call(this, Keyword, arguments);
    if (obj) return obj;

    keyword = this.args[0];
    ignCase = this.args[1];

    this.keyword = keyword;
    this.ignCase = Boolean(ignCase);
}
Keyword.prototype = Object.create(Jsleri.prototype);
Keyword.prototype.constructor = Keyword;

/**************************************************************************
 * List constructor
 **************************************************************************/
var List = function List (element, delimiter, _min, _max, opt) {
    var obj = Jsleri.call(this, List, arguments);
    if (obj) return obj;

    element = this.args[0];
    delimiter = (this.args[1] === undefined) ? new Token(',') : this.args[1];

    _min = this.args[2];
    _max = this.args[3];
    opt = this.args[4];

    if (!(element instanceof Jsleri))
        throw '(Jsleri-->List) first argument must be an instance of Jsleri; got ' + typeof element;

    if (typeof delimiter !== 'string' && !(delimiter instanceof Jsleri))
        throw '(Jsleri-->List) second argument must be a string or instance of Jsleri; got ' + typeof delimiter;

    this.element = element;
    this.delimiter = (delimiter instanceof Jsleri) ? delimiter : new Token(delimiter);
    this.min = (_min === undefined || _min === null) ? 0 : _min;
    this.max = (_max === undefined || _max === null) ? null : _max;

    // when true the list may end with a delimiter
    this.opt = Boolean (opt);
};
List.prototype = Object.create(Jsleri.prototype);
List.prototype.constructor = List;

/**************************************************************************
 * Optional constructor
 **************************************************************************/
function Optional (element) {
    var obj = Jsleri.call(this, Optional, arguments);
    if (obj) return obj;

    element = this.args[0];

    if (!(element instanceof Jsleri))
        throw '(Jsleri-->Optional) first argument must be an instance of Jsleri; got ' + typeof element;

    this.element = element;
}
Optional.prototype = Object.create(Jsleri.prototype);
Optional.prototype.constructor = Optional;

/**************************************************************************
 * Prio constructor
 **************************************************************************/
function Prio () {
    var obj = Jsleri.call(this, Prio, arguments);
    if (obj) return obj;

    this.elements = this.checkElements(this.args);
    return (new Rule(this));
}
Prio.prototype = Object.create(Jsleri.prototype);
Prio.prototype.constructor = Prio;

/**************************************************************************
 * Regex constructor
 **************************************************************************/
function Regex (re, ignCase) {
    var obj = Jsleri.call(this, Regex, arguments);
    if (obj) return obj;

    re = this.args[0];
    ignCase = this.args[1];

    this.re = re;
    this._re = new RegExp('^' + re, ignCase ? 'i' : undefined);
}
Regex.prototype = Object.create(Jsleri.prototype);
Regex.prototype.constructor = Regex;

/**************************************************************************
 * Repeat constructor
 **************************************************************************/
function Repeat (element, _min, _max) {
    var obj = Jsleri.call(this, Repeat, arguments);
    if (obj) return obj;

    element = this.args[0];
    _min = this.args[1];
    _max = this.args[2];

    if (!(element instanceof Jsleri))
        throw '(Jsleri-->Repeat) first argument must be an instance of Jsleri; got ' + typeof element;

    this.element = element;
    this.min = (_min === undefined || _min === null) ? 0 : _min;
    this.max = (_max === undefined || _max === null) ? null : _max;
}
Repeat.prototype = Object.create(Jsleri.prototype);
Repeat.prototype.constructor = Repeat;

/**************************************************************************
 * Ref constructor
 **************************************************************************/
var refSet = function (element) {
    if (!(element instanceof Jsleri))
        throw '(Jsleri-->Ref-->set) first argument must be an instance of Jsleri; got ' + typeof element;
    Object.assign(this, element);
};

function Ref (Cls) {
    var Construct = function () {};
    Construct.prototype = Cls.prototype;
    var obj = Jsleri.call(this, Construct, arguments);
    if (obj) {
        obj.set = refSet;
        return obj;
    }
}
Ref.prototype = Object.create(Jsleri.prototype);
Ref.prototype.constructor = Ref;

/**************************************************************************
 * Grammar constructor
 **************************************************************************/
function Grammar (element, reKeywords) {
    var obj = Jsleri.call(this, Grammar, arguments);
    if (obj) return obj;

    element = this.args[0];
    reKeywords = this.args[1];

    var grammar = null;

    if (element === undefined) {
        element = this.constructor.START;
        grammar = this.constructor;
    } else if (element.START) {
        grammar = element;
        element = element.START;
    }

    if (grammar !== null) {
        Object.getOwnPropertyNames(grammar).forEach(name => {
            if (grammar[name] instanceof Jsleri) {
                grammar[name].name = name;
            }
        });
    }

    if (!(element instanceof Jsleri))
        throw '(Jsleri-->Optional) first argument must be an instance of Jsleri; got ' + typeof element;

    this.reKeywords = (reKeywords === undefined) ? RE_KEYWORDS : buildReKeywords(reKeywords);
    this.element = element;

    this.parse = function (str) {
        var tree = new Node(this, 0, str.length, str);
        var nodeRes = parse(
            element,
            str,
            tree.children,
            this.reKeywords
        );

        nodeRes.tree = tree;
        return nodeRes;
    };
}
Grammar.prototype = Object.create(Jsleri.prototype);
Grammar.prototype.constructor = Grammar;

/**************************************************************************
 * Rule constructor
 **************************************************************************/
function Rule (element) {
    var obj = Jsleri.call(this, Rule, arguments);
    if (obj) return obj;

    element = this.args[0];

    if (!(element instanceof Jsleri))
        throw '(Jsleri-->Rule) first argument must be an instance of Jsleri; got ' + typeof element;

    this.element = element;
}
Rule.prototype = Object.create(Jsleri.prototype);
Rule.prototype.constructor = Rule;

/**************************************************************************
 * Sequence constructor
 **************************************************************************/
function Sequence () {
    var obj = Jsleri.call(this, Sequence, arguments);
    if (obj) return obj;

    this.elements = this.checkElements(this.args);
}
Sequence.prototype = Object.create(Jsleri.prototype);
Sequence.prototype.constructor = Sequence;

/**************************************************************************
 * This constructor --> THIS
 **************************************************************************/
var This = function () {
    if (!(this instanceof This))
        return new This();
};
This.prototype = Object.create(Jsleri.prototype);
This.prototype.constructor = This;
var THIS = new This();

/**************************************************************************
 * Token constructor
 **************************************************************************/
function Token (token) {
    var obj = Jsleri.call(this, Token, arguments);
    if (obj) return obj;

    token = this.args[0];

    if (typeof token !== 'string')
        throw '(Jsleri-->Token) first argument must be a string; got ' + typeof token;

    this.token = token;
}
Token.prototype = Object.create(Jsleri.prototype);
Token.prototype.constructor = Token;

/**************************************************************************
 * Tokens constructor
 **************************************************************************/
function Tokens (tokens) {
    var obj = Jsleri.call(this, Tokens, arguments);
    if (obj) return obj;

    tokens = this.args[0];

    if (typeof tokens !== 'string')
        throw '(Jsleri-->Tokens) first argument must be a string; got ' + typeof tokens;

    this.tokens = tokens.trim().split(RE_WHITESPACE).sort(sortOnStrLen);
}
Tokens.prototype = Object.create(Jsleri.prototype);
Tokens.prototype.constructor = Tokens;

/**************************************************************************
 * EndOfStatement constructor
 **************************************************************************/
function EndOfStatement () {
    this.e = 'End of statement';
}
EndOfStatement.prototype = Object.create(Jsleri.prototype);
EndOfStatement.prototype.constructor = EndOfStatement;
var EOS = new EndOfStatement();

/**************************************************************************
 * NodeResult constructor
 **************************************************************************/
function NodeResult (isValid, pos) {
    this.isValid = isValid;
    this.pos = pos;
    this.expecting = null;
}

/**************************************************************************
 * Node constructor
 **************************************************************************/
function Node (element, start, end, str) {
    this.element = element;
    this.start = start;
    this.end = end;
    this.str = str;
    this.children = [];
}
Node.prototype.walk = function () {
    this.element.onEnter(this);
    for (var i = 0, l = this.children.length; i < l; i ++) {
        this.children[i].walk();
    }
    this.element.onExit(this);
};

/**************************************************************************
 * Expecting constructor
 **************************************************************************/
function Expecting () {
    this.required = [];
    this.optional = [];
    this.pos = 0;
    this._modes = [this.required];
}
Expecting.prototype.setModeRequired = function (pos, isRequired) {
    if (this._modes[pos] !== this.optional)
        this._modes[pos] = (isRequired === false) ? this.optional : this.required;
};
Expecting.prototype.empty = function () {
    this.required.length = 0;
    this.optional.length = 0;
};
Expecting.prototype.update = function (element, pos) {
    if (pos > this.pos) {
        this.empty();
        this.pos = pos;
    }
    if (pos === this.pos && this._modes[pos].indexOf(element) === -1)
        this._modes[pos].push(element);
};
Expecting.prototype.getExpecting = function () {
    return this.required.concat(this.optional);
};

/***************************************************************************
 * Jsleri constructor
 *
 * All 'other' objects inherit from Jsleri
 ***************************************************************************/
function Jsleri (Cls, args) {
    args = Array.prototype.slice.call(args);

    if (!(this instanceof Cls))
        return new (Cls.bind.apply(Cls, [Cls].concat(args)))();

    this.setCallbacks(args);
    this.args = args;
}
Jsleri.prototype.setCallbacks = function (args) {
    var first = args[0];

    if (first === undefined ||
        first === null ||
        typeof first === 'string' ||
        first instanceof Jsleri ||
        first.START !== undefined) return;

    if (isFunction(first.onEnter))
        this.onEnter = first.onEnter;

    if (isFunction(first.onExit))
        this.onExit = first.onExit;

    args.splice(0, 1);
};
Jsleri.prototype.onEnter = noop;
Jsleri.prototype.onExit = noop;
Jsleri.prototype.checkElements = function (a) {
    var i = 0, l = a.length;
    if (l === 0)
        throw '(Jsleri-->' + this.constructor.name + ') Need at least one Jsleri argument';
    for (; i < l; i++)
        if (!(a[i] instanceof Jsleri)) {
            a[i] = new Token(a[i]);
        }
    return a;
};
Jsleri.prototype.checkElement = function (a) {
    if (!(a instanceof Jsleri)) {
        a = new Token(a);
    }
    return a;
};

export {
    version,
    noop,
    Keyword,
    Regex,
    Token,
    Tokens,
    Sequence,
    Choice,
    Repeat,
    List,
    Optional,
    Ref,
    Prio,
    THIS,
    Grammar,
    EOS
};
