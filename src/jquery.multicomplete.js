// TODO: this shouldn't be here
var KEY = {
	UP: 38,
	DOWN: 40,
	DEL: 46,
	TAB: 9,
	RETURN: 13,
	ESC: 27,
	COMMA: 188,
	PAGEUP: 33,
	PAGEDOWN: 34,
	BACKSPACE: 8
};
MultiComplete = {};
MultiComplete.Base = $.klass({
  
  // just takes a hash of configuration
  // this gets mixed into the instance so you can override anything
  initialize: function(config) {    
    if(config.input){
      this.element = $(config.input); // So that superclasses can override the usual input element
    }
    
    // the data we're searching through
    // can override 'search' to do something different
    this.data = [];
    
    // list of items matching the text entered
    this.current_matches = [];
    
    // index of the currently selected item (if any)
    this.current_index = false;
    
    // how many results to show
    this.num_results = 10;
    
    // the input field we're monitoring
    this.input = this.element;
    
    // this is where the suggestions will go
    this.suggestions_container = null;
    
    // anything passed in the config
    $.extend(this, config || {})
    //Object.extend(this, (config || {}));
    
    this.build();
  },
  
  // builds the suggestions container etc...
  // override to do other things too
  build: function() {
    this.suggestions_container = $("<div />").addClass('autocomplete').hide().css("position", "absolute").appendTo(document.body);
    //this.input.insert({after: this.suggestions_container});
  },
  
  show: function() {
    if (this.showing) {
      return;
    }
    this.showing = true;
    this.show_suggestions();
  },
  
	findPos: function(obj) {
		var curleft = obj.offsetLeft || 0;
		var curtop = obj.offsetTop || 0;
		while (obj = obj.offsetParent) {
			curleft += obj.offsetLeft
			curtop += obj.offsetTop
		}
		return {x:curleft,y:curtop};
	},

  show_suggestions: function() {
    var pos = this.findPos(this.input[0]);
    this.suggestions_container
      .css({
        width: this.input.width() + "px",
        top: pos.y + this.input[0].offsetHeight + "px",
        left: pos.x + "px"
      })
      .show();  
    // this.fix_ie();
  },
  
  hide: function() {
    this.showing = false;    
    this.current_index = null;
    this.suggestions_container.hide();
  },
  
  // called when we select something
  // otherwise just calling hide leaves the data there so you can hit down
  // and the selection will stay in place
  reset: function(){
    this.current_matches = [];
    this.hide();
  },
  
  onkeydown: function(e) {
    switch (e.keyCode) {   
      case KEY.UP:
        this.up();
        e.preventDefault();
        break;
    
      case KEY.DOWN:
        this.down();
        e.preventDefault();
        break;
    
      case KEY.RETURN:
        e.preventDefault();
        this.select_current();
        break;
    
      default: 
        break;
    }
  },
  
  onkeyup: function(e){
    switch (e.keyCode) {      
      case KEY.RETURN:   
        this.enter_pressed(e);
        break;      

      // ignore these and pass on through
      case KEY.UP:
      case KEY.DOWN: 
        break;
      
      case KEY.ESC:
        this.hide();
        break;
      
      // search if any of the above don't match
      default: 
        this.search();
        break;
    }
  },
  
  // only stop enter from submitting if we're showing the form
  // override this if you want to never submit the form on enter
  enter_pressed: function(e){
    if (this.showing){
      e.preventDefault();
    }
  },
  
  // by default just populate the text field with the value
  // override to do something more interesting
  select_current: function(){
    var value = this.current_value();
    if (!value){
      return;
    }
    this.input.value = value;
    this.reset();
  },
  
  // get the data for the current selected item
  current_value: function(){
    if (this.current_index == null){
      return false;
    }
    return this.current_matches[this.current_index];
  },
  
  // prepare to search for items matching the text in the field
  // does the actual search in find_items_matching so that it can be
  // easily overriden for ajax, just has to call "found_items" with any result
  search: function() {
    var text = this.input.val();
    if (text === '') {
      this.hide();
      return;
    }
    
    this.current_index = null;
    this.current_matches = [];
    this.find_items_matching(text);
  },
  
  found_items: function(items, search_text) {
    this.current_matches = items;
    
    if (this.current_matches.length === 0) {
      this.hide();
    } else {
      var html = this.html_for_items(search_text);
      this.suggestions_container.html(html);
      this.show(); 
    }    
  },
  
  // return the HTML you want to use for your autocomplete list
  // by default we assume this will be a UL with an LI element per item
  html_for_items: function(search_text){
    var html = $("<ul/>");
    var context = this;
    $.each(this.current_matches, function(n,item) {
      $("<li/>").html(context.html_for_item(item, search_text)).appendTo(html);
    });
    // this.current_matches.each(function(item){
    //   html += this.html_for_item(item, search_text);
    // }.bind(this));
    return html;
  },
  
  // return the HTML for one individual item in the list
  // assumes the item is a single string of text, but can just as easily
  // override and work with an object etc...
  html_for_item: function(item, search_text) {
    // if (!this._html_for_item_template) {
    //   this._html_for_item_template = new Template([
    //     '<li>',
    //       '#{item}',
    //     '</li>'
    //   ].join(''));      
    // }
    //return this._html_for_item_template.evaluate({item: item});
    return item;
  },
  
  up: function () {
    if (!this.showing || this.current_index === null){return;}
    this.current_index -= 1;
    if (this.current_index < 0){
      this.current_index = null;
    }
    this.highlight_selection();
  },
  
  down: function () {
    if (this.current_matches.length == 0){return;};
    
    if (this.current_index == null){
      this.current_index = 0;
    }else{
      this.current_index += 1;
      if (this.current_index > (this.current_matches.length - 1)){
        this.current_index = this.current_matches.length - 1;
      }      
    }
    this.highlight_selection();
    if (!this.showing){
      this.show();
    }
  },
  
  // add the class "selected" to the current selected item
  // there can be only one selected item, so remove from any existing one first
  highlight_selection: function() {
    var current = this.suggestions_container.find(".selected");
    if (current){
      current.removeClass("selected");
    }
    var selected = this.suggestions_container.find("li")[this.current_index];
    if (selected){
      $(selected).addClass("selected");
    }
  },
  
  // by default this goes through the data array we have
  // you could override this to go off and load the data with ajax
  // or whatever takes your fancy so long as it passes any results to "found_items"
  find_items_matching: function(text) {
    var text = this.escape_regex(text.toLowerCase());
    
    // return the first x who match the finder  
    var items = $.grep(this.data, this.finder(text));
    
    this.found_items(items, text);
  },
  
  // return a function that can be passed to jQuery grep in order to filter the results
  finder: function(text){
    return function(item, i) {
      return item.toLowerCase().match(text)
    };
  },
  
  // escape any symbols in the text which will mess up a regex
  // http://simonwillison.net/2006/Jan/20/escape/
  escape_regex: function(text) {
    if (!arguments.callee.sRE) {
      var specials = [
        '/', '.', '*', '+', '?', '|',
        '(', ')', '[', ']', '{', '}', '\\'
      ];
      arguments.callee.sRE = new RegExp(
        '(\\' + specials.join('|\\') + ')', 'g'
      );
    }
    return text.replace(arguments.callee.sRE, '\\$1');
  }

  
  
})