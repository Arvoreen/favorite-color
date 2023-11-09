'use strict';
/*
 Summary
 You are to write a single page HTML & JavaScript web application that allows a user to manage a simple data set of their ranked favorite colors.
 Requirements
 The application must be runnable locally on any workstation that has a modern browser. When the application starts, it must present the user with an ordered view of their favorite colors with the following minimum fields:
 • Color
 • Rank Number
 • Description or Notes
 In addition to showing the list to the user, the application must allow the user to manipulate the list with the following minimum requirements:
 • Add a color
 • Edit a color and description
 • Delete a color
 • Change a color’s rank in the list
 Assessment
 The application implementation will be assessed based on the following characteristics:
 • Implementation of minimum functional requirements
 • Code quality, specifically readability and best practices – i.e., can someone else jump in and
 maintain the application.
 • Functional user interface and usability - how intuitive and easy is the UI to interact with
 • Creativity and initiative – added value that is identified through a demonstration of forward
 thinking code design, implementation, or immediate determination of value-added features that exceed the requirements and have value to end-users.
 */

/*global m  -- mitrhril provided by webpack*/

import * as bootstrap from 'bootstrap';
import '../scss/styles.scss';

var prop = require('mithril/stream'); // for easy property setting

// generate a unique ID for each favorite object created
var favoriteCount = 0;

function uniqueId() {
    return function () {
        return ++favoriteCount;
    };
};

// Model to track favorite colors
var Favorite = function (data) {
    this.color = prop(data.color);
    this.notes = prop(data.notes || '');
    this.rank = prop(data.rank || 1);
    this.editing = prop(data.editing || false);
    this.key = uniqueId();
};

// custom comparator -- to allow sorting based on rank
function FavoriteCompare(a, b) {
    // rank 1 before rank 2, etc.
    console.log('compare ' + a.color() + ', rank: ' + a.rank() + ' to ' + b.color() + ', rank: ' + b.rank());
    let arank = parseInt(a.rank()), brank = parseInt(b.rank());

    if (arank < brank) {
        return -1;
    }
    if (arank> brank) {
        return 1;
    }
    // same rank at this point, so sort by color name
    if (a.color() < b.color()) {
        return -1;
    }
    if (a.color() > b.color()) {
        return 1;
    }
    // failsafe
    return 0;
};

// simple storage/retrieval of favorites via browser local storage service
const STORAGE_ID = 'charity-engine-favorites';
var Storage = {
    get:    function () {
        let vals = JSON.parse(window.localStorage.getItem(STORAGE_ID) || '[]');
        let ret = [];
        vals.forEach((elem) => ret.push(new Favorite(elem)));
        return ret;
    }, put: function (favorites) {
        localStorage.setItem(STORAGE_ID, JSON.stringify(favorites));
    },
};

// the main controller -- provides the various actions we need to support our app
var Controller = {
    // load collection of favorites from storage on startup
    oninit: function () {
        this.list = Storage.get();
        this.sort();
    },

    // placeholders for new entries
    color: prop(''), notes: prop(''), rank: prop(1),

    // add a new favorite color
    add:           function () {
        // get current values
        var color = this.color().trim();
        var notes = this.notes().trim();
        var rank = this.rank();

        // if a name was provided, add the new favorite
        if (color) {
            this.list.push(new Favorite({color: color, rank: rank, notes: notes}));
            Storage.put(this.list);
            this.sort();
        }

        // reset entry fields
        this.color('');
        this.notes('');
        this.rank(0);
    },
    edit:          function (favorite) {
        // save off current values, and turn on editing flag
        favorite.previousColor = favorite.color();
        favorite.previousNotes = favorite.notes();
        favorite.previousRank = favorite.rank();
        favorite.editing(true);
    }, // finished editing, save the changes
    doneEditing:   function (favorite, index) {
        if (!favorite.editing()) {
            return;
        }
        favorite.editing(false);
        favorite.color(favorite.color().trim());
        if (!favorite.color()) {
            this.list.splice(index, 1);
        }
        favorite.notes(favorite.notes().trim());
        Storage.put(this.list);
        Controller.sort();
    }, // cancel editing
    cancelEditing: function (favorite) {
        favorite.color(favorite.previousColor);
        favorite.notes(favorite.previousNotes);
        favorite.rank(favorite.previousRank);
        favorite.editing(false);
    }, // remove the selected favorite
    remove:        function (index) {
        this.list.splice(index, 1);
        Storage.put(this.list);
        this.sort();
    }, // reset color input
    clearColor:    function () {
        this.color('');
        return this;
    }, //reset notes input
    clearNotes:    function () {
        this.notes('');
        return this;
    }, // reset rank to default
    clearRank:     function () {
        this.rank(1);
        return this;
    }, // sort our list
    sort:          function () {
        this.list.sort(FavoriteCompare);
    },
};

// now our views -- split into the main view and footer
var Footer = {
    view: function (vnode) {
        return m('footer.footer', [m('span.favorite-count', [m('strong', Controller.list.length), ' favorite colors'])]);
    },
};

function WatchInput(onenter, onescape) {
    return function (e) {
        e.redraw = false;
        if (e.keyCode === app.ENTER_KEY) {
            onenter();
            e.redraw = true;
        }
        else if (e.keyCode === app.ESC_KEY) {
            onescape();
            e.redraw = true;
        }
    };
};

var MainView = {
    focused: false, view: function () {
        return [
            m('header',
              {class: 'justify-content-between align-items-md-center pb-3 mb-5 border-bottom container'},
              [
                  m('div', {class: 'row'}, m('h1', 'favorites')),
                  m('form',
                    [
                        m('div',
                          {class: 'row mb-3 border-all gx-3'},
                          [
                              m('div', {class: 'col-sm-6'},
                                m('input[placeholder="Color Name"]', {
                                    class:   'p-10',
                                    onkeyup: WatchInput(Controller.add.bind(Controller),
                                                        Controller.clearColor.bind(Controller)),
                                    value:   Controller.color(),
                                    oninput: function (e) {
                                        Controller.color(e.target.value);
                                    },
                                })),
                              m('div', {class: 'col-sm-6'},
                                m('input.new-favorite[placeholder="Optional Notes"]', {
                                    onkeyup: WatchInput(Controller.add.bind(Controller),
                                                        Controller.clearNotes.bind(Controller)),
                                    value:   Controller.notes(),
                                    oninput: function (e) {
                                        Controller.notes(e.target.value);
                                    },
                                })),
                          ]),
                        m('div',
                          {class: 'row align-middle'},
                          [
                              m('div',
                                {class: 'col-sm-4 col-form-label'},
                                m('label', {for: 'rankInput', class: 'form-label '}, 'Rank')),
                              m('div', {class: 'col-sm-8'}, m('input[type="number"]', {
                                  class:   'form-control',
                                  onkeyup: WatchInput(Controller.add.bind(Controller),
                                                      Controller.clearRank.bind(Controller)),
                                  value:   Controller.rank(),
                                  oninput: function (e) {
                                      Controller.rank(e.target.value);
                                  },
                              })),
                          ]),
                    ]),
              ]),
            m('section#main', {
                style: {
                    display: Controller.list.length ? '' : 'none',
                },
            }, [
                  m('ul.list-group.list-group-flush', [
                      Controller.list.map(function (favorite, index) {
                          return m('li.list-group-item', {
                              class:     (function () {
                                  var classes = '';
                                  classes += favorite.editing() ? ' editing' : 'view';
                                  return classes;
                              })(), key: favorite.key,
                          }, [
                                       m('div.card',
                                         m('.card-body', [
                                             m('h5.card-title', {
                                                 ondblclick: Controller.edit.bind(Controller, favorite),
                                             }, favorite.color()),
                                             m('h6.card-subtitle', [m('span', 'Rank: '), m('span', favorite.rank())]),
                                             m('.card-text',
                                               m('.row.border', [
                                                   m('.col-sm-2', 'Notes:'),
                                                   m('.col-sm-10', {
                                                       ondblclick: Controller.edit.bind(Controller, favorite),
                                                   }, favorite.notes()),
                                                   m('button.destroy', {
                                                       onclick: Controller.remove.bind(Controller, index),
                                                   }),
                                               ]),
                                             ),
                                             m('button.destroy', {
                                                 onclick: function (e) {
                                                     Controller.remove(index);
                                                 },
                                             }),
                                             m('.editblock', [

                                                 m('.row', [
                                                     m('label.col-sm-2.col-form-label', 'Color'),
                                                     m('div', {class: 'col-sm-10'},
                                                       m('input.edit', {
                                                           class:   'form-control',
                                                           value:   favorite.color(),
                                                           onkeyup: WatchInput(Controller.doneEditing.bind(Controller,
                                                                                                           favorite,
                                                                                                           index),
                                                                               Controller.cancelEditing.bind(Controller,
                                                                                                             favorite)),
                                                           oninput: function (e) {
                                                               e.redraw = false;
                                                               favorite.color(e.target.value);
                                                           },
                                                       })),
                                                 ]),
                                                 m('.row', [
                                                     m('label.col-sm-2.col-form-label', 'Notes'),
                                                     m('div', {class: 'col-sm-10'},
                                                       m('input.edit', {
                                                           class:   'form-control',
                                                           value:   favorite.notes(),
                                                           onkeyup: WatchInput(Controller.doneEditing.bind(Controller,
                                                                                                           favorite,
                                                                                                           index),
                                                                               Controller.cancelEditing.bind(Controller,
                                                                                                             favorite)),
                                                           oninput: function (e) {
                                                               e.redraw = false;
                                                               favorite.notes(e.target.value);
                                                           },
                                                       })),
                                                 ]),
                                                 m('.row', [
                                                     m('label.col-sm-2.col-form-label', 'Rank'),
                                                     m('div', {class: 'col-sm-10'},
                                                       m('input.edit[type="number"]', {
                                                           class:   'form-control',
                                                           value:   favorite.rank(),
                                                           onkeyup: WatchInput(Controller.doneEditing.bind(Controller,
                                                                                                           favorite,
                                                                                                           index),
                                                                               Controller.cancelEditing.bind(Controller,
                                                                                                             favorite)),
                                                           oninput: function (e) {
                                                               e.redraw = false;
                                                               favorite.rank(e.target.value);
                                                           },
                                                       })),
                                                 ]),
                                             ]),
                                         ])),
                                   ]);
                      }),
                  ]),
              ]),
        ];
    },
};

var app = {
    oninit: Controller.oninit(), view: function () {
        return m('main', [m(MainView), Controller.list.length === 0 ? '' : m(Footer)]);
    },
};

app.ENTER_KEY = 13;
app.ESC_KEY = 27;

m.route(document.getElementById('app'), '/', {
    '/': app, '/:filter': app,
});