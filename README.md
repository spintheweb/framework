<img src="https://avatars0.githubusercontent.com/u/16848901?s=460&u=acaf05c1e801337a7f6a87676ec886ccba9c641e&v=4" width="100p">

# Spin the Web Project
_Technology that eases eVerse development_

Spin the Web deals with the Webbase Markup Language (WBML). Simply put, HTML describes a web page, WBML, a web site; and, while HTML is interpreted by a client side web browser, WBML, by a server side _web spinner_. It is this project opinion that WBML is a missing component in the World Wide Web space.

It must be stressed that WBML does not replace any technology, it coordinates technologies; it focuses on _contents_ (rendered data pages), defining what they are, how they are organized, and where, how and when they are rendered. Web spinners output contents on request.

WBML can describe web sites, intranets, extranets, portals, web apps, web services, here collectively referred to as _internet sites_. It is a fundamental language for Content Management Systems (CMS). 

The term _webbase_ was first used in 1998, a name given to a relational database whose schema defined a site: its structure, content, layout, localization, navigation and security aspects. Later, to ease portability, the webbase was formalized into the XML based Webbase Markup Language (WBML), this introduced also the term _webbaselet_, a webbase fragment. Today WBML is also described in JSON.

## Features
* Content centered
* Role Based Access Control
* Multilingual & Multinational (localized)
* Templated
* WebSocket based

## Elements
Spin the Web addresses three issues to ease web develpments: describe, interpret and build. It is based on pillars of web development, HTML (SVG), CSS, Javascript, to name a few, it is not for the faint of heart, a good dose of know-how is necessary, full stack development know-how.

A _webbase_ is an hierachically organized structure of three base elements: _areas_, _pages_ and _contents_; at the root of the hierarchy there is a special area, the _site_. The file system analogy may be of help: the _site_ is the drive, _areas_ are folders, _pages_ are files and _contents_ are things inside files! Like the file system, a webbase also addresses security, a security based on a simple, inherited role based visibility paradigm.

## Contents
_Contents_ are central, they come in four flavors: _navigational_, _organizational_, _presentational_ and _special_. The purpose of contents is to allow _interaction_ with data of any kind, they request data, provide data, they can be simple microservices, dashbords that are described macroscopically by (WBML) Webbase Markup Language and microscopically (WBLL) Webbase Layout Language

* navigational &mdash; these content render as menubars, menu, breadcrumbs, image maps
* organizational &mdash; these contents render as tabs, calendars, group
* presentational &mdash; these contents render as forms, lists, tables, trees, graphs 
* special &mdash; these contents can be client side scripts and API

## Paradigm
A web spinner&mdash;a web server that understands WBML&mdash;receives a request from a client, these are the logical steps that follow: 
* If the request is the first request sent by the client, a session is established thus defining a unique _session context_
* The web spinner determines from the resquest if the WDBL requested is already loaded, if not, it is loaded
* The web spinner, subject to the session context, consults the WBML file and responds with either: a list of REST calls the client should make or a resource
* If the client receives a list of REST calls, it sends requests for each of them asynchronously via websockets
* Else it receives a resource
* The _session context_ stores the connected user, its associated roles and locale. When a new session is established, the user is preset to _guest_ and roles to _guests_.

## Spin the Web Studio
Spin the Web Studio is a webbaselet that eases the development of a Spin the Web site. It is added to a site webbase and is accessible to developers (.i.e. users with a developers role), its contents interact directly with the underlying site webbase.
