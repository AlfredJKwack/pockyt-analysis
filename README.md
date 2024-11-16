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
* [x] Tag usage frequency graph
* [x] Tag cloud
* [ ] Tag usage frequency graph over time
* [ ] Tag pair heat map (what goes together and what does not)
* [-] Filter entries by 1 or more tags
* [ ] Clean data set to remove Null entries (not sure what those are)
* [ ] Highlight entries with no tags somehow
* [ ] Refactor code to be more modular