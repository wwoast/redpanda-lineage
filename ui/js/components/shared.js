import { h, Fragment } from "@dependencies/nanojsx";
/**
 * make *text* italic and **text** bold with JSX foo
 * as well as process the newlines and extra spaces in long lones of text
 * definitions.
 * 
 * For JA and ZH, consciously remove spaces and new lines. For
 * others, just crunch multiple spaces to a single space.
 */
export const FormatText = (props)=>{
  const parts = props.text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, index)=>{
    if (part.startsWith('**') && part.endsWith('**')) {
      return /*#__PURE__*/ h("strong", {
        key: index
      }, part.slice(2, -2));
    } else if (part.startsWith('*') && part.endsWith('*')) {
      return /*#__PURE__*/ h("em", {
        key: index
      }, part.slice(1, -1));
    } else {
      return /*#__PURE__*/ h(Fragment, null, part);
    }
  });
};
