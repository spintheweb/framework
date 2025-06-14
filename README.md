<img src="./public/media/Logo-bn_128x128.png" width="100p">

# Spin the Web Project
_Technology that eases web application developments_

Spin the Web introduces the Webbase Markup Language (WBML). While HTML describes a single web page and is interpreted by client-side browsers, WBML describes an entire web site and is interpreted by a server-side component called a web spinner. This project proposes that WBML fills a crucial gap in the World Wide Web ecosystem.

WBML is not intended to replace existing technologies, but rather to coordinate them. Its focus is on _contents_ (data handling widgets): defining what they are, how they are organized, and where, how, and when they are rendered. Web spinners generate and deliver these contents on demand.

WBML can be used to describe web sites, intranets, extranets, portals, web apps, and web services—here collectively referred to as web applications. It serves as a foundational language for Content Management Systems (CMS).

The term webbase was first coined in 1998 to describe a relational database whose schema defined a site's structure, content, layout, localization, navigation, and security. To improve portability, the webbase concept evolved into the XML-based Webbase Markup Language (WBML), introducing the idea of a _webbaselet_—a fragment of a webbase. Today, WBML is also available in JSON format.

## Features
* Content-centric architecture
* Role-Based Access Control
* Multilingual & Multinational (localization support)
* Templating system
* WebSocket-based communication

## Elements
Spin the Web addresses three core challenges in web development: description, interpretation, and construction. It builds upon the pillars of web development—HTML (and SVG), CSS, and JavaScript. This framework is designed for experienced developers with full-stack expertise.

A webbase is a hierarchical structure composed of three primary elements: areas, pages, and contents. At the root is a special area called the site. You can think of the webbase like a file system: the site is the drive, areas are folders, pages are files, and contents are the items within those files. Like a file system, a webbase also incorporates security, using a simple, inherited, role-based visibility model.

## Contents
_Contents_ are central, they come in four flavors: _navigational_, _organizational_, _presentational_ and _special_. The purpose of contents is to allow _interaction_ with data of any kind, they request data, provide data, they can be simple microservices, dashbords that are described macroscopically by (WBML) Webbase Markup Language and microscopically (WBLL) Webbase Layout Language

* navigational &mdash; these content render as menubars, menu, breadcrumbs, image maps
* organizational &mdash; these contents render as tabs, calendars, group
* presentational &mdash; these contents render as forms, lists, tables, trees, graphs 
* special &mdash; these contents can be client side scripts and API

## Paradigm
A web spinner&mdash;a web server that understands WBML&mdash;receives a request from a client, these are the logical steps that follow: 
* If the request is the first request sent by the client, a session is established thus defining a unique _session context_
* The web spinner determines from the resquest if the WBML requested is already loaded, if not, it is loaded
* The web spinner, subject to the session context, consults the WBML file and responds with either: a list of REST calls the client should make or a resource
* If the client receives a list of REST calls, it sends requests for each of them asynchronously via websockets
* Else it receives a resource
* The _session context_ stores the connected user, its associated roles and locale. When a new session is established, the user is preset to _guest_ and roles to _guests_.

# Spin the Web Studio

Spin the Web Studio is the visual and interactive environment for building, managing, and customizing Spin the Web sites and applications. It provides a user-friendly interface for both developers and content editors to design layouts, manage content, configure data sources, and preview changes in real time.

## Key Features

- **Visual Content Editing:**  
  Drag-and-drop interface for arranging content blocks, menus, trees, forms, and other components.

- **Live Preview:**  
  Instantly see how changes affect the site, with support for multiple languages and user roles.

- **Data Source Management:**  
  Configure and connect to various data sources (webbase, SQL, etc.), and visually map queries to content.

- **Layout Designer:**  
  Edit and preview WBLL (Webbase Layout Language) templates, manage placeholders, and control responsive layouts.

- **Tree and Navigation Management:**  
  Organize site structure, breadcrumbs, and navigation menus with intuitive tree views.

- **Calendar and Scheduling:**  
  Manage events and time-based content using integrated calendar views.

- **Localization Tools:**  
  Easily manage translations and localized content for multilingual sites.

- **Custom Scripting and Extensions:**  
  Add custom scripts, styles, and logic to extend site functionality directly from the studio.

## Workflow

1. **Design:**  
   Use the visual designer to arrange content and navigation.
2. **Configure:**  
   Set up data sources, queries, and dynamic content.
3. **Preview:**  
   Instantly see changes as they would appear to end users.
4. **Publish:**  
   Deploy updates to the live site with a single click.

## Who Is It For?

- **Developers:**  
  Rapidly prototype and extend site features with code and visual tools.
- **Content Editors:**  
  Manage and update site content without technical knowledge.
- **Site Administrators:**  
  Oversee structure, permissions, and localization from a central dashboard.

---

Spin the Web Studio streamlines the entire site-building process, making it accessible, efficient, and