import { _Renderer } from './Renderer.ts';
import { _defaults } from './defaults.ts';
import type { MarkedToken, Token } from './Tokens.ts';
import type { MarkedOptions } from './MarkedOptions.ts';
import { h, isVNode, type VNode } from 'vue';

/**
 * Parsing & Compiling
 */
export class _Parser {
  options: MarkedOptions;
  renderer: _Renderer;
  constructor(options?: MarkedOptions) {
    this.options = options || _defaults;
    this.options.renderer = this.options.renderer || new _Renderer();
    this.renderer = this.options.renderer;
    this.renderer.options = this.options;
    this.renderer.parser = this;
  }

  /**
   * Static Parse Method
   */
  static parse(tokens: Token[], options?: MarkedOptions) {
    const parser = new _Parser(options);
    return parser.parse(tokens);
  }

  /**
   * Static Parse Inline Method
   */
  static parseInline(tokens: Token[], options?: MarkedOptions) {
    const parser = new _Parser(options);
    return parser.parseInline(tokens);
  }

  /**
   * Parse Loop
   */
  parse(tokens: Token[], top = true): VNode[] {
    const out: VNode[] = [];

    for (const anyToken of tokens) {
      const token = anyToken as MarkedToken;
      switch (token.type) {
        case 'space': {
          out.push(this.renderer.space(token));
          break;
        }
        case 'hr': {
          out.push(this.renderer.hr(token));
          break;
        }
        case 'heading': {
          out.push(this.renderer.heading(token));
          break;
        }
        case 'code': {
          out.push(this.renderer.code(token));
          break;
        }
        case 'table': {
          out.push(this.renderer.table(token));
          break;
        }
        case 'blockquote': {
          out.push(this.renderer.blockquote(token));
          break;
        }
        case 'list': {
          out.push(this.renderer.list(token));
          break;
        }
        case 'html': {
          out.push(this.renderer.html(token));
          break;
        }
        case 'paragraph': {
          out.push(this.renderer.paragraph(token));
          break;
        }
        case 'text': {
          out.push(this.renderer.text(token));
          break;
        }

        default: {
          // Run any renderer extensions for generic tokens
          if (this.options.extensions?.renderers?.[anyToken.type]) {
            const ret = this.options.extensions.renderers[anyToken.type].call({ parser: this }, anyToken);
            if (ret) {
              if (isVNode(ret)) out.push(ret);
              else out.push(h('span', { innerHTML: ret }));
              break;
            }
          }

          // if we didn't find anything to parse the token, return an error
          const errMsg = 'Token with "' + anyToken.type + '" type was not found.';
          if (this.options.silent) {
            console.error(errMsg);
            return [];
          } else {
            throw new Error(errMsg);
          }
        }
      }
    }

    return out;
  }

  /**
   * Parse Inline Tokens
   */
  parseInline(tokens: Token[], renderer: _Renderer = this.renderer): VNode[] {
    const out: VNode[] = [];

    for (const anyToken of tokens) {
      const token = anyToken as MarkedToken;

      switch (token.type) {
        case 'escape': {
          out.push(renderer.text(token));
          break;
        }

        case 'html': {
          out.push(renderer.html(token));
          break;
        }

        case 'link': {
          out.push(renderer.link(token));
          break;
        }

        case 'image': {
          out.push(renderer.image(token));
          break;
        }

        case 'strong': {
          out.push(renderer.strong(token));
          break;
        }

        case 'em': {
          out.push(renderer.em(token));
          break;
        }

        case 'codespan': {
          out.push(renderer.codespan(token));
          break;
        }

        case 'br': {
          out.push(renderer.br(token));
          break;
        }

        case 'del': {
          out.push(renderer.del(token));
          break;
        }

        case 'text': {
          out.push(renderer.text(token));
          break;
        }

        default: {
          // Run any renderer extensions
          if (this.options.extensions?.renderers?.[anyToken.type]) {
            const ret = this.options.extensions.renderers[anyToken.type].call({ parser: this }, anyToken);
            if (ret) {
              if (isVNode(ret)) out.push(ret);
              else out.push(h('span', { innerHTML: ret }));
              break;
            }
          }

          // if we didn't find anything to parse the token, return an error
          const errMsg = 'Token with "' + token.type + '" type was not found.';
          if (this.options.silent) {
            console.error(errMsg);
            return [];
          } else {
            throw new Error(errMsg);
          }
        }
      }
    }

    return out;
  }
}
