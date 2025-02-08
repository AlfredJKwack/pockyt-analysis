======
pockyt analysis
======

This is a simple visual analysis of a Pocket dataset.

Links
-----

* `GitHub repository <https://github.com/alfredjkwack/pockyt-analysis>`
* `D3.js <https://d3js.org/>`
* `alfredjkwack/pockyt <https://github.com/alfredjkwack/pockyt>`

About
-----
`Pocket <https://getpocket.com/>`_ is an application for managing a reading list of articles from the Internet.

**pockyt-analysis** provides a simple analysis of the pocket data using the D3.js JavaScript library for bespoke
 data visualization . It relies on a fork of **pockyt** (a commandline client that interfaces the pocket API) to obtain the data as a json file.

Installation
------------

Since this project is dependent on **alfredjkwack/pockyt** we will assume you have already installed it.

1. Clone this repository: :code:`git clone https://github.com/alfredjkwack/pockyt-analysis.git`
2. Generate a json file of your pocket data: :code:`pockyt -json -o pocket-data.json`
3. Launch a local web server and connect to it with a browser: :code:`python -m SimpleHTTPServer`

TODO
------------
* [ ] ~~Tag usage frequency graph~~
* [x] Tag co-occurrence graph
* [ ] ~~Tag cloud~~
* [x] Tag pair arc diagram
* [x] Tag usage frequency graph over time
* [x] Tag pair heat map (what goes together and what does not)
* [x] Filter entries by 1 or more tags
* [x] Clean data set to remove Null entries (not sure what those are)
* [-] Highlight entries with no tags somehow
* [ ] Refactor code to be more modular
* [x] Table : URL's with no title need some love to shorten
* [x] Table : Sorting of the date column needs to be correct
* [x] Table : Sorting of the columns should not lead to overflow
* [ ] ~~Table : Sorting of the columns should not lead to column widths changing~~
* [ ] Table : Tags need a nicer color to match the theme
* [x] Table : The table head has a little too much white space