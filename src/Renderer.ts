import { _defaults } from './defaults.ts';
import {
  cleanUrl,
  escape,
} from './helpers.ts';
import { other } from './rules.ts';
import type { MarkedOptions } from './MarkedOptions.ts';
import type { Tokens } from './Tokens.ts';
import type { _Parser } from './Parser.ts';
import { Fragment, h, Text, type VNode } from 'vue';

/**
 * Renderer
 */
export class _Renderer {
  options: MarkedOptions;
  parser!: _Parser; // set by the parser
  constructor(options?: MarkedOptions) {
    this.options = options || _defaults;
  }

  space(token: Tokens.Space): VNode {
    return h(Text, '');
  }

  code({ text, lang, escaped }: Tokens.Code): VNode {
    const langString = (lang || '').match(other.notSpaceStart)?.[0];

    const code = text.replace(other.endingNewline, '') + '\n';

    if (!langString) {
      return h('pre', {},
        h('code', { innerHTML: escaped ? code : escape(code, true) }),
      );
    }

    return h('pre', { class: 'code--' + escape(langString, true) },
      h('code', {
        class: 'code--' + escape(langString, true),
        innerHTML: escaped ? code : escape(code, true),
      }),
    );
  }

  blockquote({ tokens }: Tokens.Blockquote): VNode {
    const body = this.parser.parse(tokens);
    return h('blockquote', {}, body);
  }

  html({ text }: Tokens.HTML | Tokens.Tag) : VNode {
    return h('span', { innerHTML: text });
  }

  heading({ tokens, depth }: Tokens.Heading): VNode {
    return h(`h${depth}`, this.parser.parseInline(tokens));
  }

  hr(token: Tokens.Hr): VNode {
    return h('hr');
  }

  list(token: Tokens.List): VNode {
    const ordered = token.ordered;
    const start = token.start;

    const type = ordered ? 'ol' : 'ul';
    return h(type, { start: ordered && start !== 1 ? start : undefined }, token.items.map(x => this.listitem(x)));
  }

  listitem(item: Tokens.ListItem): VNode {
    return h('li', this.parser.parse(item.tokens, !!item.loose));
  }

  checkbox({ checked }: Tokens.Checkbox): VNode {
    return h('input', { type: 'checkbox', checked });
  }

  paragraph({ tokens }: Tokens.Paragraph): VNode {
    return h('p', this.parser.parseInline(tokens));
  }

  table(token: Tokens.Table): VNode {
    const header = this.tablerow(token.header.map(x => this.tablecell(x)));
    const body = token.rows.map(row =>
      this.tablerow(row.map(cell => this.tablecell(cell))),
    );

    return h('table', {}, [header, body]);
  }

  tablerow(cells: VNode[]): VNode {
    return h('tr', cells);
  }

  tablecell(token: Tokens.TableCell): VNode {
    const type = token.header ? 'th' : 'td';
    return h(type, { align: token.align }, this.parser.parseInline(token.tokens));
  }

  /**
   * span level renderer
   */
  strong({ tokens }: Tokens.Strong): VNode {
    return h('strong', this.parser.parseInline(tokens));
  }

  em({ tokens }: Tokens.Em): VNode {
    return h('em', this.parser.parseInline(tokens));
  }

  codespan({ text }: Tokens.Codespan): VNode {
    return h('code', text);
  }

  br(token: Tokens.Br): VNode {
    return h('br');
  }

  del({ tokens }: Tokens.Del): VNode {
    return h('del', this.parser.parseInline(tokens));
  }

  link({ href, title, tokens }: Tokens.Link): VNode {
    const inlineParsed = this.parser.parseInline(tokens);
    const cleanHref = cleanUrl(href);
    if (cleanHref === null) {
      return h(Fragment, inlineParsed);
    }
    href = cleanHref;
    return h('a', { href, title }, inlineParsed);
  }

  image({ href, title, text }: Tokens.Image): VNode {
    const cleanHref = cleanUrl(href);
    if (cleanHref === null) {
      return h(Text, text);
    }
    href = cleanHref;

    return h('img', { src: href, alt: text, title });
  }

  text(token: Tokens.Text | Tokens.Escape): VNode {
    return 'tokens' in token && token.tokens
      ? h(Fragment, this.parser.parseInline(token.tokens))
      : h(Text, token.text);
  }
}
