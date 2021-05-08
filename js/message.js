/* 
    Show functions used to generate translated heading snippets in various page modes
*/
var Message = {};   /* Namespace */

Message.arrivals = function(zoo, born, language) {
  // Zoo search: display arriving animals along with ones just born.
  // If any animals were born, this message gets a baby icon suffix
  var link = document.createElement('a');
  link.href = "javascript:";
  var link_id = "arrivals/zoo/" + zoo["_id"];
  link.id = link_id;
  link.addEventListener("click", function() {
    document.getElementById(link_id).scrollIntoView(true);
  });
  var p = document.createElement('p');
  for (var i in L.messages.zoo_header_new_arrivals[language]) {
    var field = L.messages.zoo_header_new_arrivals[language][i];
    var msg = document.createTextNode(field);
    p.appendChild(msg);
  }
  if (born.length > 0) {
    var suffix = document.createTextNode(" " + Language.L.emoji.baby);
    p.appendChild(suffix);
  }
  link.appendChild(p);
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(link);
  var message = document.createElement('div');
  message.className = "arrivalsHeader";
  message.appendChild(shrinker);
  return message;
}
Message.arrived_from_zoo = function(zoo, date, language) {
  // Text to go into the Show.zooLink function
  var text = "";
  for (var i in L.messages.arrived_from_zoo[language]) {
    var field = L.messages.arrived_from_zoo[language][i];
    if (field == "<INSERTDATE>") {
      field = date;
      text = text + field;
    } else if (field == "<INSERTZOO>") {
      field = zoo;
      text = text + field;
    } else {
      text = text + field;
    }
  }
  return text; 
}
Message.birthday = function(name, animal_id, years, language) {
  var link = document.createElement('a');
  link.href = "#panda/" + animal_id;
  var p = document.createElement('p');
  for (var i in L.messages.happy_birthday[language]) {
    var field = L.messages.happy_birthday[language][i];
    if (field == "<INSERTNAME>") {
      field = name;
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    } else if (field == "<INSERTNUMBER>") {
      field = years;
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    } else {
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    }
  }
  link.appendChild(p);
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(link);
  var message = document.createElement('div');
  message.className = "birthdaySummary";
  message.appendChild(shrinker);
  return message;
}
Message.closed = function(date, language) {
  var p = document.createElement('p');
  for (var i in L.messages.closed[language]) {
    var field = L.messages.closed[language][i];
    if (field == "<INSERTDATE>") {
      field = date;
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    } else {
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    }
  }
  return p;  
}
Message.credit = function(credit, count, language) {
  // Draw a header for crediting someone's photos contribution 
  // with the correct language
  var p = document.createElement('p');
  for (var i in L.messages.credit[language]) {
    var field = L.messages.credit[language][i];
    if (field == "<INSERTUSER>") {
      field = credit;
      var msg = document.createElement('i');
      msg.innerText = field;
      p.appendChild(msg);
    } else if (field == "<INSERTNUMBER>") {
      field = count;
      var msg = document.createElement('b');
      msg.innerText = field;
      p.appendChild(msg);
    } else {
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    }
  }
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(p);
  var message = document.createElement('div');
  message.className = "creditSummary";
  message.appendChild(shrinker);
  return message;
}
Message.creditSingleFilter = function(credit, filter, count, language) {
  // Draw a header for crediting someone's photos contribution 
  // with the correct language
  filter = Language.capitalNames(filter);
  var p = document.createElement('p');
  for (var i in L.messages.credit_animal_filter_single[language]) {
    var field = L.messages.credit_animal_filter_single[language][i];
    if (field == "<INSERTUSER>") {
      field = credit;
      var msg = document.createElement('i');
      msg.innerText = field;
      p.appendChild(msg);
    } else if (field == "<INSERTNUMBER>") {
      field = count;
      var msg = document.createElement('b');
      msg.innerText = field;
      p.appendChild(msg);
    } else if (field == "<INSERTNAME>") {
      field = filter;
      var msg = document.createElement('b');
      msg.innerText = field;
      p.appendChild(msg);
    } else {
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    }
  }
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(p);
  var message = document.createElement('div');
  message.className = "creditSummary";
  message.appendChild(shrinker);
  return message;
}
Message.departed_to_zoo = function(zoo, date, language) {
  // Text to go into the Show.zooLink function
  var text = "";
  for (var i in L.messages.departed_to_zoo[language]) {
    var field = L.messages.departed_to_zoo[language][i];
    if (field == "<INSERTDATE>") {
      field = date;
      text = text + field;
    } else if (field == "<INSERTZOO>") {
      field = zoo;
      text = text + field;
    } else {
      text = text + field;
    }
  }
  return text; 
}
Message.departures = function(zoo, deaths, leaving, language) {
  // Zoo search: display departing animals along with ones that died.
  // If any animals passed away, this message gets a rainbow icon suffix
  var link = document.createElement('a');
  link.href = "javascript:";
  var link_id = "departures/zoo/" + zoo["_id"];
  link.id = link_id;
  link.addEventListener("click", function() {
    document.getElementById(link_id).scrollIntoView(true);
  });
  var p = document.createElement('p');
  for (var i in L.messages.zoo_header_recently_departed[language]) {
    var field = L.messages.zoo_header_recently_departed[language][i];
    var msg = document.createTextNode(field);
    p.appendChild(msg);
  }
  if ((deaths.length > 0) && (leaving.length == deaths.length)) {
    var suffix = document.createTextNode(" " + Language.L.emoji.died);
    p.appendChild(suffix);
  }
  link.appendChild(p);
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(link);
  var message = document.createElement('div');
  message.className = "departuresHeader";
  message.appendChild(shrinker);
  return message;
}
Message.findNearbyZoo = function(language) {
  var link = document.createElement('a');
  link.href = "#query/nearby";
  var p = document.createElement('p');
  p.className = "summaryEmphasis";
  for (var i in L.messages.find_a_nearby_zoo[language]) {
    var field = L.messages.find_a_nearby_zoo[language][i];
    var msg = document.createTextNode(field);
    p.appendChild(msg);
  }
  link.appendChild(p);
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(link);
  var message = document.createElement('div');
  message.className = "frontPageSummary";
  message.appendChild(shrinker);
  return message;
}
Message.foundAnimal = function(name, animal_id, language) {
  var link = document.createElement('a');
  link.href = "#panda/" + animal_id;
  var p = document.createElement('p');
  for (var i in L.messages.found_animal[language]) {
    var field = L.messages.found_animal[language][i];
    if (field == "<INSERTNAME>") {
      field = name;
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    } else {
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    }
  }
  link.appendChild(p);
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(link);
  var message = document.createElement('div');
  message.className = "memorialSummary";
  message.appendChild(shrinker);
  return message;
}
Message.geolocationStart = function(language) {
  var p = document.createElement('p');
  for (var i in L.messages.nearby_zoos[language]) {
    var field = L.messages.nearby_zoos[language][i];
    var msg = document.createTextNode(field);
    p.appendChild(msg);
  }
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(p);
  var message = document.createElement('div');
  message.className = "frontPageSummary";
  message.appendChild(shrinker);
  return message;
}
Message.lostAnimal = function(name, animal_id, zoo_name, zoo_contact, language) {
  var link = document.createElement('a');
  link.href = "#profile/" + animal_id;
  var p = document.createElement('p');
  for (var i in L.messages.lost_animal[language]) {
    var field = L.messages.lost_animal[language][i];
    if (field == "<INSERTNAME>") {
      field = name;
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    } else if (field == "<ZOONAME>") {
      field = zoo_name;
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    } else if (field == "<ZOOCONTACT>") {
      field = zoo_contact;
      var b = document.createElement('b');
      var msg = document.createTextNode(field);
      b.appendChild(msg);
      p.appendChild(b);
    } else {
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    }
  }
  link.appendChild(p);
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(link);
  var message = document.createElement('div');
  message.className = "memorialSummary";
  message.appendChild(shrinker);
  return message;
}
Message.lunch_time = function(language) {
  var link = document.createElement('a')
  link.href = "#query/lunch time";
  var p = document.createElement('p');
  for (var i in L.messages.lunch_time[language]) {
    var field = L.messages.lunch_time[language][i];
    var msg = document.createTextNode(field);
    p.appendChild(msg);
  }
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(p);
  var message = document.createElement('div');
  message.className = "tagSummary";
  message.appendChild(shrinker);
  link.appendChild(message);
  return link;
}
Message.memorial = function(name, animal_id, birth, death, language) {
  var link = document.createElement('a');
  link.href = "#panda/" + animal_id;
  var p = document.createElement('p');
  for (var i in L.messages.goodbye[language]) {
    var field = L.messages.goodbye[language][i];
    if (field == "<INSERTNAME>") {
      field = name;
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    } else if (field == "<INSERTBIRTH>") {
      field = birth;
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    } else if (field == "<INSERTDEATH>") {
      field = death;
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    } else {
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    }
  }
  link.appendChild(p);
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(link);
  var message = document.createElement('div');
  message.className = "memorialSummary";
  message.appendChild(shrinker);
  return message;
}
Message.memorialGroup = function(name_string, id_string, language) {
  var link = document.createElement('a');
  link.href = "#group/" + id_string;
  var p = document.createElement('p');
  for (var i in L.messages.remembering_you_together[language]) {
    var field = L.messages.remembering_you_together[language][i];
    if (field == "<INSERTNAMES>") {
      field = name_string;
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    } else {
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    }
  }
  link.appendChild(p);
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(link);
  var message = document.createElement('div');
  message.className = "memorialSummary";
  message.appendChild(shrinker);
  return message;
}
Message.missing_you = function(name, animal_id, birth, death, language) {
  var link = document.createElement('a');
  link.href = "#panda/" + animal_id;
  var p = document.createElement('p');
  for (var i in L.messages.missing_you[language]) {
    var field = L.messages.missing_you[language][i];
    if (field == "<INSERTNAME>") {
      field = name;
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    } else if (field == "<INSERTBIRTH>") {
      field = birth;
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    } else if (field == "<INSERTDEATH>") {
      field = death;
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    } else {
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    }
  }
  link.appendChild(p);
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(link);
  var message = document.createElement('div');
  message.className = "memorialSummary";
  message.appendChild(shrinker);
  return message;
}
Message.new_photos = function(language) {
  // Grab update counts
  var counts = {
    "contributors": P.db._totals.updates.authors,
    "entities":  P.db._totals.updates.entities,
    "photos": P.db._totals.updates.photos,
    "suffix": 1,   // HACK
    "pandas": P.db._totals.updates.pandas,
    "zoos": P.db._totals.updates.zoos
  }
  var section_order = [];
  if (counts["zoos"] == 0 && 
      counts["entities"] == 0 && 
      counts["photos"] == 0 &&
      counts["pandas"] == 0) {
    return document.createElement('br');   // No message to display
  }
  // Zoo counts are too much information
  if (counts["pandas"] > 0 && counts["photos"] > 0) {
    section_order = ["pandas", "photos", "suffix"];
  } else if (counts["pandas"] > 0 ) {
    section_order = ["pandas", "contributors", "suffix"];
  } else if (counts["contributors"] > 0) {
    section_order = ["contributors", "photos", "suffix"];
  } else {
    section_order = ["photos", "suffix"];
  }
  var lookup = Language.L.messages.new_photos;
  var pieces = [];
  for (let part of section_order) {
    var count = counts[part];
    if (count == 0) {
      continue;
    }
    var output = "";
    var message = lookup[part][language];
    for (var i in message) {
      var field = message[i];
      if (field == "<INSERTCOUNT>") {
        output = output + count;
      } else {
        output = output + field;
      }
    }
    pieces.push(output);
  }
  pieces = Language.unpluralize(pieces);
  // Build a string out of phrases with commas + &
  var p = Language.commaPhrase(pieces);
  p.className = "updatePhotosMessage";
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(p);
  var message = document.createElement('div');
  message.className = "frontPageSummary";
  message.appendChild(shrinker);
  return message;
}
Message.profile_children = function(name, children_count, daughters, sons, language) {
  var p = document.createElement('p');
  var babies = 0;
  if (children_count != daughters + sons) {
    babies = children_count - daughters - sons;
  }
  // Choose the type of message
  var message = undefined;
  if (daughters > 0 && sons > 0 && babies > 0) {
    message = L.messages.profile_children_babies;
  } else if (daughters > 0 && sons > 0) {
    message = L.messages.profile_children;
  } else if (daughters > 0 && babies > 0) {
    message = L.messages.profile_daughters_babies;
  } else if (sons > 0 && babies > 0) {
    message = L.messages.profile_sons_babies;
  } else if (daughters > 0) {
    message = L.messages.profile_daughters;
  } else if (sons > 0) {
    message = L.messages.profile_sons;
  } else if (babies > 0) {
    message = L.messages.profile_babies_children;
  } else {
    message = L.messages.profile_children;
  }
  var output_text = "";
  // Do string replacement
  for (var i in message[language]) {
    var field = message[language][i];
    if (field == "<INSERTNAME>") {
      output_text = output_text.concat(name);
    } else if (field == "<INSERTTOTAL>") {
      output_text = output_text.concat(children_count);
    } else if (field == "<INSERTDAUGHTERS>") {
      output_text = output_text.concat(daughters);
    } else if (field == "<INSERTSONS>") {
      output_text = output_text.concat(sons);
    } else if (field == "<INSERTBABIES>") {
      output_text = output_text.concat(babies);
    } else {
      output_text = output_text.concat(field);
    }
  }
  output_text = Language.unpluralize([output_text])[0];
  p.appendChild(document.createTextNode(output_text));

  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(p);
  var message = document.createElement('div');
  message.className = "profileSummary";
  message.appendChild(shrinker);
  return message;
}
Message.profile_family = function(name, language) {
  var p = document.createElement('p');
  for (var i in L.messages.profile_family[language]) {
    var field = L.messages.profile_family[language][i];
    if (field == "<INSERTNAME>") {
      var msg = document.createTextNode(name);
      p.appendChild(msg);
    } else {
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    }
  }
  // Fix s's if it appears
  var innerText = p.innerText;
  p.innerText = innerText.replace("s's", "s'");
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(p);
  var message = document.createElement('div');
  message.className = "profileSummary";
  message.appendChild(shrinker);
  return message;
}
Message.profile_siblings = function(name, sibling_count, sisters, brothers, language) {
  var p = document.createElement('p');
  var babies = 0;
  if (sibling_count != sisters + brothers) {
    babies = sibling_count - sisters - brothers;
  }
  // Choose the type of message
  var message = undefined;
  if (sisters > 0 && brothers > 0 && babies > 0) {
    message = L.messages.profile_siblings_babies;
  } else if (sisters > 0 && brothers > 0) {
    message = L.messages.profile_siblings;
  } else if (sisters > 0 && babies > 0) {
    message = L.messages.profile_sisters_babies;
  } else if (brothers > 0 && babies > 0) {
    message = L.messages.profile_brothers_babies;
  } else if (sisters > 0) {
    message = L.messages.profile_sisters;
  } else if (brothers > 0) {
    message = L.messages.profile_brothers;
  } else if (babies > 0) {
    message = L.messages.profile_babies_siblings;
  } else {
    message = L.messages.profile_siblings;
  }
  var output_text = "";
  for (var i in message[language]) {
    var field = message[language][i];
    if (field == "<INSERTNAME>") {
      output_text = output_text.concat(name);
    } else if (field == "<INSERTTOTAL>") {
      output_text = output_text.concat(sibling_count);
    } else if (field == "<INSERTSISTERS>") {
      output_text = output_text.concat(sisters);
    } else if (field == "<INSERTBROTHERS>") {
      output_text = output_text.concat(brothers);
    } else if (field == "<INSERTBABIES>") {
      output_text = output_text.concat(babies);
    } else {
      output_text = output_text.concat(field);
    }
  }
  output_text = Language.unpluralize([output_text])[0];
  p.appendChild(document.createTextNode(output_text));

  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(p);
  var message = document.createElement('div');
  message.className = "profileSummary";
  message.appendChild(shrinker);
  return message;
}
Message.profile_where = function(name, language) {
  var p = document.createElement('p');
  for (var i in L.messages.profile_where[language]) {
    var field = L.messages.profile_where[language][i];
    if (field == "<INSERTNAME>") {
      var msg = document.createTextNode(name);
      p.appendChild(msg);
    } else {
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    }
  }
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(p);
  var message = document.createElement('div');
  message.className = "profileSummary";
  message.appendChild(shrinker);
  return message;
}
Message.residents = function(zoo, language) {
  // Zoo search: display a header for the resident animals
  // that didn't recently leave or arrive
  var link = document.createElement('a');
  link.href = "javascript:";
  var link_id = "residents/zoo/" + zoo["_id"];
  link.id = link_id;
  link.addEventListener("click", function() {
    document.getElementById(link_id).scrollIntoView(true);
  });
  var info = Show.acquireZooInfo(zoo, language);
  var p = document.createElement('p');
  for (var i in L.messages.zoo_header_other_pandas[language]) {
    var field = L.messages.zoo_header_other_pandas[language][i];
    if (field == "<INSERTZOO>") {
      var msg = document.createTextNode(info.name);
      p.appendChild(msg);
    } else {
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    }
  }
  link.appendChild(p);
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(link);
  var message = document.createElement('div');
  message.className = "residentsHeader";
  message.appendChild(shrinker);
  return message;
}
Message.shovel_pandas = function(language) {
  var link = document.createElement('a')
  link.href = "#query/dig";
  var p = document.createElement('p');
  for (var i in L.messages.shovel_pandas[language]) {
    var field = L.messages.shovel_pandas[language][i];
    var msg = document.createTextNode(field);
    p.appendChild(msg);
  }
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(p);
  var message = document.createElement('div');
  message.className = "tagSummary";
  message.appendChild(shrinker);
  link.appendChild(message);
  return link;
}
Message.tag_combo = function(num, emojis, language) {
  var p = document.createElement('p');
  // Emojis come first!
  for (let emoji of emojis) {
    p.appendChild(document.createTextNode(emoji + " "));
  }
  var output_text = "";
  for (var i in L.messages.tag_combo[language]) {
    var field = L.messages.tag_combo[language][i];
    if (field == "<INSERTNUM>") {
      output_text = output_text.concat(num);
    } else {
      if (num == 1) {
        field = Language.unpluralize([field]);
      }
      output_text = output_text.concat(field);
    }
  }
  output_text = Language.unpluralize([output_text])[0];
  p.appendChild(document.createTextNode(output_text));
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(p);
  var message = document.createElement('div');
  message.className = "tagSummary";
  message.appendChild(shrinker);
  return message;
}
Message.tag_subject = function(num, name, emoji, tag, language) {
  // If there was an id as part of a tagExpression, rewrite this message
  // using the panda's localized name instead.
  if (Pandas.checkId(name) == true) {
    name = Pandas.searchPandaId(name)[0][language + ".name"];
  }
  if (name != undefined) {
    name = Language.capitalNames(name);
  }
  // For translating a tag between languages, we need the first value in
  // the array of tags considered equivalent.
  // Need to look up "baby" info as well from the polyglot list of things
  // that can be either keywords or tags.
  var near_tag = undefined;
  if (tag in Language.L.tags) {
    near_tag = Language.L.tags[tag][language][0];
  } else {
    near_tag = Language.L.polyglots[tag][language][0];
  }
  var p = document.createElement('p');
  for (var i in L.messages.tag_subject[language]) {
    var field = L.messages.tag_subject[language][i];
    if (field == "<INSERTNUM>") {
      var msg = document.createTextNode(num);
      p.appendChild(msg);
    } else if (field == "<INSERTNAME>") {
      var msg = document.createElement('i');
      var text = document.createTextNode(name);
      if (name != undefined) {
        msg.appendChild(text);
        p.appendChild(msg);
      }
    } else if (field == "<INSERTEMOJI>") {
      var msg = document.createTextNode(emoji);
      p.appendChild(msg);
    } else if (field == "<INSERTTAG>") {
      var msg = document.createElement('b');
      var text = document.createTextNode(near_tag);
      msg.appendChild(text);
      p.appendChild(msg);
    } else {
      if (num == 1) {
        field = Language.unpluralize([field]);
      }
      var msg = document.createTextNode(field);
      if ((language == "jp") && (i == 1) && (name == undefined)) {
        msg = document.createTextNode("枚");
      }
      p.appendChild(msg);
    }
  }
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(p);
  var message = document.createElement('div');
  message.className = "tagSummary";
  message.appendChild(shrinker);
  return message;
}
Message.trick_or_treat = function(language) {
  var link = document.createElement('a')
  link.href = "#query/pumpkin";
  var p = document.createElement('p');
  for (var i in L.messages.trick_or_treat[language]) {
    var field = L.messages.trick_or_treat[language][i];
    var msg = document.createTextNode(field);
    p.appendChild(msg);
  }
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(p);
  var message = document.createElement('div');
  message.className = "halloweenSummary";
  message.appendChild(shrinker);
  link.appendChild(message);
  return link;
}
