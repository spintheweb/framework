# WBLL (Webbase Layout Language) Parser

This document describes the internal workings of the WBLL parser, which is responsible for transforming a WBLL layout string into a structured, renderable format.

## Overview

The parser consists of two main components:

1.  **Lexer:** A lexical analyzer that scans the raw WBLL string and breaks it down into a sequence of "tokens".
2.  **Compiler:** A function that takes the token sequence and generates an executable JavaScript function for rendering the final HTML.

This two-stage process is a performance optimization. The layout is parsed and compiled only once, and the resulting render function is cached and reused for subsequent requests, which is significantly faster than re-parsing the layout every time.

## Lexer: From String to Tokens

The lexer's primary job is to validate the syntax of the WBLL string and convert it into an array of `STWToken` objects. It uses a single, large regular expression to perform this tokenization in one pass.

### Tokenization Process

The lexer's master regular expression is a combination of smaller patterns, each designed to match a specific piece of the language (an attribute, a comment, an interactive element, etc.). The lexer iterates through the input string, and for each match, it determines which pattern was successful and creates the appropriate `STWToken`.

The patterns are ordered by priority. If a segment of the string could match multiple patterns, the one that appears first in the master regex takes precedence.

### Error Handling

The final pattern in the master regex is a special "catch-all" for errors. If a character in the input string does not match any of the valid token patterns, it is caught by this error pattern. When this happens, the lexer immediately throws a `SyntaxError`, pointing to the exact location of the invalid character in the input string. This prevents invalid layouts from being processed.

### Key Syntactical Elements Recognized

The lexer is designed to recognize and tokenize the following language constructs:

-   **Attribute Tokens (`\a`, `\A`, `\s`):** These tokens define attributes or settings and must be followed by arguments enclosed in `('...')`.
-   **Layout Tokens (`\r`, `\n`, `\t`):** Represent formatting like line breaks and tabs. They may optionally have arguments.
-   **Interactive Tokens (`a`, `A`, `b`, `o`):** Core elements like links and buttons. They can have optional arguments and can be followed by a chain of parameter tokens (`p(...)`) or field cursor movements (`<`, `>`).
-   **General Single-Letter Tokens:** A large group of tokens (like `c`, `e`, `f`, `h`, etc.) that represent various HTML elements and have optional arguments.
-   **Tokens Requiring Arguments:** A smaller set of tokens (like `d`, `n`, `v`, `k`) that are syntactically invalid without arguments.
-   **Comments:** Both single-line (`// ...`) and multi-line (`/* ... */`) comments are recognized and discarded by the lexer.
-   **Field Cursor Movement (`<`, `>`):** Characters that control which data field is currently active.

By the end of the lexing process, the `STWLayout` object holds a clean, validated array of `STWToken` objects, ready for the compilation stage.

## WBLL Examples

Below are examples of common WBLL constructs and the HTML they produce.

### Basic Elements

**Text and Formatting**

-   **WBLL:** `t('Hello, World!') \r`
-   **HTML:** `Hello, World!<br>`
-   **Explanation:** The `t` token creates a text node, and `\r` creates a line break.

**Links**

-   **WBLL:** `a('/home')p('action;buh')t('Go Home')`
-   **HTML:** `<a href="/home?action=buh">Go Home</a>`
-   **Explanation:** The `a` token creates a hyperlink, followed by the `p` token that modifies the hyperlink querystring, finally the `t` token that assigns the link text. If `t` is omitted the link text will be the hyperlink text.

**Buttons**

-   **WBLL:** `b('/;Save Changes')`
-   **HTML:** `<button>Save Changes</button>`
-   **Explanation:** The `b` token creates a button. The first argument is the destination the second the button label. TODO: Most likely this token will be similar to `a`.

### Attributes

Attributes can be added to most elements using the `\a` token.

-   **WBLL:** `b('/;Save;;stw;go')\a('class="btn btn-primary"') `
-   **HTML:** `<button class="btn btn-primary">Save</button>`
-   **Explanation:** The `\a` token that follows the `b` token adds the `class` attribute to the button.

### Form Inputs

Form inputs often interact with the `fields` array and `placeholders` map.

**Simple Text Input**

-   **WBLL:** `l('Username')e`
-   **Assuming:** the field cursor point to `fields[0]` whose name is `user_name` and `@@user_name` value is `alice`.
-   **HTML:** `<label>Username</label><input name="user_name" value="alice">`
-   **Explanation:**
    1.  `l('Username')` creates a label.
    2.  `e` creates an input that interract with the active field, i.e., the field indicated by field cursor. `name` and `value` are derived from `fields[0]`.

**Checkbox**

-   **WBLL:** `c('remember' 'true') l('Remember Me')`
-   **Assuming:** `placeholders.get("@@remember")` is `"true"`.
-   **HTML:** `<input name="remember" checked><label>Remember Me</label>`
-   **Explanation:** The `c` token creates a checkbox. The `checked` attribute is added because the corresponding placeholder (`@@remember`) has a value.

### Advanced Links with Parameters

The `p` token adds query string parameters to a link.

-   **WBLL:** `a('/search' p('q' 'durable widgets') p('sort' 'price_asc') 'Search')`
-   **HTML:** `<a href="/search?q=durable%20widgets&sort=price_asc">Search</a>`
-   **Explanation:** Each `p` token adds a key-value pair to the URL's query string, with values being properly URL-encoded.

**Dynamic Parameters**

-   **WBLL:** `l('User ID')a('/users/view')p('id')t()'View Profile')`
-   **Assuming:** `fields[0]` is `"user_id"` and `placeholders.get("@@user_id")` is `"123"`.
-   **HTML:** `<label>User ID</label><a href="/users/view?id=123">View Profile</a>`
-   **Explanation:** The `p('id')` token has no second argument, so its value is dynamically looked up from the placeholders using the `fields` array.