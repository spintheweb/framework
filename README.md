![status: work in progress](https://img.shields.io/badge/status-WIP-yellow)

# Spin the Web Framework
_A precise (π) yet fuzzy (σ) technology that eases web application developments_

Spin the Web introduces the Webbase Description Language (WBDL). While HTML describes a single web page and is interpreted by client-side browsers, WBDL describes an entire web site and is interpreted by a server-side component called a web spinner. This project proposes that WBDL fills a crucial gap in the World Wide Web ecosystem!

WBDL is not intended to replace existing technologies, but rather to coordinate them. Its focus is on _contents_ (data handling widgets): defining what they are, how they are organized, and where, how, and when they are rendered. Web spinners generate and deliver these contents on demand.

WBDL can be used to describe web sites, intranets, extranets, portals, web apps, and web services—here collectively referred to as web applications. It serves as a foundational language for Content Management Systems (CMS).

The term webbase was first coined in 1998 to describe a relational database whose schema defined a site's structure, content, layout, localization, navigation, and security. To improve portability, the webbase concept evolved into the XML-based Webbase Description Language (WBDL), introducing the idea of a _webbaselet_—a fragment of a webbase. Today, WBDL is also available in JSON format.

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
_Contents_ are central, they come in four flavors: _navigational_, _organizational_, _presentational_ and _special_. The purpose of contents is to allow _interaction_ with data of any kind, they request data, provide data, they can be simple microservices, dashbords that are described macroscopically by (WBDL) Webbase Description Language and microscopically (WBLL) Webbase Layout Language

* navigational &mdash; these content render as menubars, menu, breadcrumbs, image maps
* organizational &mdash; these contents render as tabs, calendars, group
* presentational &mdash; these contents render as forms, lists, tables, trees, graphs 
* special &mdash; these contents can be client side scripts and API

## Paradigm
A web spinner&mdash;a web server that understands WBDL&mdash;receives a request from a client, these are the logical steps that follow: 
* If the request is the first request sent by the client, a session is established thus defining a unique _session context_
* The web spinner determines from the resquest if the WBDL requested is already loaded, if not, it is loaded
* The web spinner, subject to the session context, consults the WBDL file and responds with either: a list of REST calls the client should make or a resource
* If the client receives a list of REST calls, it sends requests for each of them asynchronously via websockets
* Else it receives a resource
* The _session context_ stores the connected user, its associated roles and locale. When a new session is established, the user is preset to _guest_ and roles to _guests_.

