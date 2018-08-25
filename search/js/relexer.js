if (typeof(reLexer) == 'undefined') {

// *
// * reLexer.js 0.1.3 (Uncompressed)
// * A very simple lexer and parser library written in Javascript.
// *
// * (c) 2017 Paul Engel
// * reLexer.js is licensed under MIT license
// *
// * $Date: 2017-09-16 20:28:42 +0100 (Sat, 16 September 2017) $
// *

reLexer = function(rules, root, defaultActions) {

  root || (root = Object.keys(rules).pop());

  var
    expression,
    actions,
    env,
    busy,
    matches,
    retried,
    stacktrace,
    u,//ndefined
    p,//recedence
    c = '_conj_',
    n = '_named_',
    f = 'ƒ',
    dummy = 'ﬁ',

  addMatch = function(identifier, expression, match) {
    if (identifier.indexOf(dummy) == -1)
      matches[identifier] = [expression, match];
  },

  matchPattern = function(pattern) {
    if (typeof(pattern) == 'string')
      pattern = new RegExp(pattern.replace(/[-\/\\^\$\*\+\?\.\(\)|\[\]\{\}]/g, '\\$&'));

    var
      match = expression.match(pattern);

    if (match && match.index == 0) {
      expression = expression.slice(match[0].length);
      return match[0];
    }
  },

  matchString = function(patternOrString, lazyParent) {
    var
      segments = patternOrString.match(/(.+?)(>(\w+))?(&)?(\?)?(\/(\d+))?$/) || [],
      pattern = segments[1],
      name = segments[3],
      lazy = lazyParent || !!segments[4],
      optional = !!segments[5],
      precedence = segments[7] ? parseInt(segments[7], 10) : u,
      rule = ((pattern || '').match(/:(\w+)/) || [])[1],
      match;

    if (name || optional || (rule && rules[rule])) {

      if (pattern.match(/\|/))
        pattern = reLexer.or.apply(null, pattern.split('|'));
      else
        pattern = pattern.replace(':', f);

      match = matchExpression(pattern, name, lazy, precedence);

      if ((match == u) && optional) {
        match = '';
      }

    } else {
      match = matchPattern(patternOrString);
    }

    return match;
  },

  matchConjunction = function(array, lazy) {
    array[c] || (array[c] = 'and');

    var
      initialExpression = expression,
      conjunction = array[c],
      i, pattern, match, captures = [];

    for (i = 0; i < array.length; i++) {
      pattern = array[i];
      match = matchExpression(pattern, null, lazy);

      if (match != u) {
        if (conjunction == 'and') {
          captures.push(match);
        } else {
          return match;
        }
      } else if (conjunction == 'and') {
        expression = initialExpression;
        return;
      }
    }

    if (captures.length)
      return captures;
  },

  matchExpression = function(ruleOrPattern, name, lazy, precedence) {
    if (expression == u)
      return;

    ruleOrPattern = ruleOrPattern || (f + root);

    var
      initialExpression = expression,
      initialPrecedence = p,
      rule = ((ruleOrPattern + '').indexOf(f) == 0 ? ruleOrPattern.slice(1) : u),
      isRootMatch = rule == root,
      pattern = rules[rule],
      action = (actions && rule) ? (actions[rule] || actions['*']) : u,
      identifier, matched, match, parse,
      e, m, i, r;

    if (p && precedence && p > precedence)
      return;

    if (!pattern) {
      rule = u;
      pattern = ruleOrPattern;

    } else {
      identifier = rule + ': ' + expression;

      if (arguments.length && (matched = matches[identifier])) {
        expression = matched[0];
        return matched[1];

      } else if (busy[identifier])
        return;

      busy[identifier] = !isRootMatch;
    }

    if (precedence)
      p = precedence;

    if (expression.indexOf(dummy) == -1)
      stacktrace.push(expression + ' (#' + stacktrace.length + ') ' + (rule ? '(rule) ' + rule : pattern).toString());

    if (arguments.length && (matched = matches['>' + identifier])) {
      expression = matched[0];
      match = matched[1];

    } else {
      switch (pattern.constructor) {
      case RegExp:
        match = matchPattern(pattern);
        break;
      case String:
        match = matchString(pattern, lazy);
        break;
      case Array:
        match = matchConjunction(pattern, lazy);
        break;
      }
    }

    p = initialPrecedence;

    if (rule)
      busy[identifier] = false;

    if (!isRootMatch && identifier)
      addMatch(identifier, expression, match);

    if ((match != u) || (initialExpression != expression)) {
      if (rule || name) {
        if (!actions || action)
          match = normalizeMatch(name, lazy, rule, pattern, match);
        if (actions && action) {
          parse = function() {
            return action(env, this.captures, this);
          }.bind(match);
          match = lazy ? parse : parse();
        }
      }

      if (actions && name) {
        match = [name, match];
        match[n] = true;
      }

      if (expression != u) {
        if (!expression.length)
          expression = u;

        else if (rule && precedence != u && expression && expression.indexOf(dummy) == -1) {
          e = expression;
          m = match;
          i = '>' + root + ': ' + dummy + e;

          expression = dummy + e;
          matches[i] = [e, match];

          r = matchExpression.apply(this, arguments);

          if (r == u) {
            expression = e;
            match = m;
          } else {
            match = r;
          }

          delete matches[i];
        }
      }

      if (!isRootMatch && identifier)
        addMatch(identifier, expression, match);

      return match;
    }
  },

  normalizeMatch = function(name, lazy, rule, pattern, match) {
    var
      specs = {},
      object = {},
      capture, i;

    if (name)
      specs.name = name;

    if (lazy)
      specs.lazy = lazy;

    if (rule)
      specs.rule = rule;

    specs.pattern = pattern;

    if (pattern[c])
      specs.conjunction = pattern[c];

    if (actions && (match.constructor == Array)) {
      for (i = 0; i < match.length; i++) {
        capture = match[i];
        if (capture && capture[n]) {
          object[capture[0]] = capture[1];
        }
      }
    }

    specs.captures = Object.keys(object).length ? newProxy(object) : match;

    return specs;
  },

  newProxy = function(captures) {
    return new Proxy(captures, {
      get: function(object, key) {
        var value = object[key];
        return (value && value.constructor == Function) ? value() : value;
      }
    });
  },

  scan = function() {
    var match, index;

    try {
      p = u;
      match = matchExpression();

      if (expression != u) {
        if (retried == expression)
          throw 'Unable to match expression: ' + JSON.stringify(expression);
        else {
          retried = expression;
          matches['>' + root + ': ' + expression] = [expression, match];
          return scan();
        }
      } else
        return match;

    } catch(e) {
      index = e.message && e.message.match('Maximum call stack size exceeded') ? -30 : -15;
      console.error(e);
      console.error('Expressions backtrace:\n' + stacktrace.slice(index).reverse().join('\n'));
    }
  },

  lex = function(lexExpression, environment, definedActions) {
    lexExpression = lexExpression.trim();

    if (lexExpression) {
      expression = lexExpression;
      env = environment;
      actions = (arguments.length == 1) ? u : (definedActions || defaultActions);
      busy = {};
      retried = u;
      matches = {};
      stacktrace ? stacktrace.splice(0) : (stacktrace = []);

      var result = scan();
      return typeof(result) == 'function' ? result() : result;
    }
  };

  this.tokenize = function(expression) {
    return lex(expression);
  };

  this.parse = function(expression, env, actions) {
    return lex(expression, env, actions);
  };

};

or = reLexer.or = function() {
  var array = [].slice.call(arguments);
  array._conj_ = 'or';
  return array;
};

}
