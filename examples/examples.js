$(function () {
  
  ////////////////////////
  //////  Example 1
  ////////////////////////
  
  // some local data to use
  var data = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  // text field with inline data
  $('#single_inline input').attach(MultiComplete.Base, {data: data});
  
  
  
  ////////////////////////
  //////  Example 2
  ////////////////////////
  
  // get data from a select box
  // builds its own text field
  // override the template for each item
  // overrides the finder method
  // select the corresponding item in the select box on completion
  MultiComplete.SimpleSelect = $.klass(MultiComplete.Base, {
    
    initialize: function($super){
      this.selectBox = $('#single_select_box select');
      var data = $.map(this.selectBox.find('option'), function(option,i){
        return {id: option.value, name: option.text};
      });
      var textField = $('<input type="text"/>').insertAfter(this.element);
      $super({data: data, input: textField});
    },
    
    html_for_item: function(item, search_text){
      return item.name;
    },
    
    finder: function(text){
      return function(item, i) {
        return item.name.toLowerCase().match(text)
      };
    },
    
    select_current: function(){
      var item = this.current_value();
      this.input.val('');
      this.selectBox.val(item.id);
      this.reset();
    }
  });
  
  // use data from a select box
  $('#single_select_box select').attach(MultiComplete.SimpleSelect);
  
  
  
  ////////////////////////
  //////  Example 3
  ////////////////////////
  
  // tied to a select box, so it gets its data from that
  // only shows items which haven't already been selected
  MultiComplete.MultipleSelect = $.klass(MultiComplete.Base, {

    initialize: function($super, select){
      this.selectBox = select;
      this.input = this.element;
      $super({input: this.input});
    },

    find_items_matching: function(text){
      text = this.escape_regex(text.toLowerCase());
      // get all the options from the select box to use as data
      var items = $.map(this.selectBox.find('option'),function(option,i){
        return option;
      })
      var found_items = $.grep(items, this.finder(text));
      
      this.found_items(found_items, text);
    },

    finder: function(text){
      return function(item, i) {
        if(item.selected){ return false };
        return item.text.toLowerCase().match(text)
      };
    },

    // the item here is a HTMLOptionElement so adjust the template accordingly
    html_for_item: function(item, search_text){
      return item.text;
    },

    // select the item in the select box
    select_current: function(){
      var item = this.current_value();
      this.input.val('');
      item.selected = true;
      this.reset();
    }

  });

  $('#multi_select_box input').attach(MultiComplete.MultipleSelect,$('#multi_select_box select'));

  
  ////////////////////////
  //////  Example 4
  ////////////////////////
  
  // this is the most complex example
  // it builds a list of items which have been selected and allows you to remove them
  // by clicking a remove link
  // it also allows adding items which aren't in the data and then adds them to the data
  // so they are there on the next search.
  MultiComplete.Adder = $.klass(MultiComplete.Base, {

    initialize: function($super, config){
      this.selected_items = [];
      context = this;
      this.selected_list = config.selected_list.find('a').live('click',function(){
        // remove the item from the selected items
        // this could be fancier and use the element ID or something
        var value = $(this).closest('li').children("span").text();
        var index = context.selected_items.indexOf(value);
        context.selected_items.splice(index, 1);
        $(this).closest("li").remove();
        return false        
      });
      $super(config);
    },

    // restrict to ones not already selected    
    finder: function(text){
      context = this;
      return function(item, i) {
        if($.grep(context.selected_items,function(n){ return n === item}).length){ return false }; // Convoluted way of [].include?
        return item.toLowerCase().match(text);
      };
    },

    select_current: function(){
      var item = this.current_value();

      if (!item){
        // it's a new item, add it to the list
        // this could be an ajax request to persist it etc...
        // the you could add to the list when the request returns
        var value = this.input.val();

        if ($.trim(value) === ""){
          return;
        }

        this.data.push(value);
        this.add_to_list(value, true);
      }else{
        this.add_to_list(item, false);
      }

      this.input.val('');
      this.reset();
    },

    html_for_list_item: function(item, is_new){
      var data = {name: item};
      data["new"] = is_new ? "new" : "existing";
      return '<li><span>'+data.name+'</span> ('+data.new+') <a href="#">remove</a></li>';
    },

    add_to_list: function(item, is_new){
      var html = $(this.html_for_list_item(item, is_new));
      this.selected_items.push(item);
      this.selected_list.append(html);
    },

    // this displays an indicator when your're searching
    // to say whether you're going to add a new item or not
    reset: function($super){
      $super();
      $('#new_indicator').text("");
    },

    search: function($super){
      var value = this.input.val();
      if ($.trim(value) === ""){
        $('#new_indicator').text("");
      }
      $super();
    },

    found_items: function($super, items){
      if (items.length === 0){
        $('#new_indicator').text("no matches, add new item?");
      }else{
        $('#new_indicator').text("");
      }
      $super(items);
    }

  });
  
  $('#local_adder input').attach(MultiComplete.Adder,{data: data, selected_list: $('#local_adder_selections')});
  
  
});