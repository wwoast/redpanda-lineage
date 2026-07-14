/**
 * Functions used to generate translated heading snippets in various page modes
 */

export function arrivals(zoo, born, language) {
  // Zoo search: display arriving animals along with ones just born.
  // If any animals were born, this message gets a baby icon suffix
  const link = document.createElement('a')
  link.href = "javascript:"
  const linkId = `arrivals/zoo/${zoo["_id"]}`
  link.id = linkId;
  link.addEventListener("click", function() {
    document.getElementById(linkId).scrollIntoView(true)
  });
  const p = document.createElement('p')
  for (const i in L.messages.zoo_header_new_arrivals[language]) {
    const field = L.messages.zoo_header_new_arrivals[language][i]
    const msg = document.createTextNode(field)
    p.appendChild(msg)
  }
  if (born.length > 0) {
    const suffix = document.createTextNode(" " + Language.L.emoji.baby)
    p.appendChild(suffix)
  }
  link.appendChild(p)
  return shrinkBoxMessage("arrivalsHeader", link)
}

export function arrived_from_zoo(zoo, date, language) {
  // Text to go into the Show.zooLink function
  let text = ""
  for (const i in L.messages.arrived_from_zoo[language]) {
    const field = L.messages.arrived_from_zoo[language][i]
    if (field == "<INSERTDATE>") {
      field = date
      text = text + field
    } else if (field == "<INSERTZOO>") {
      field = zoo
      text = text + field
    } else {
      text = text + field
    }
  }
  return text
}

export function autumn(language) {
  const link = document.createElement('a')
  link.href = "#query/autumn"
  const p = document.createElement('p')
  for (const i in L.messages.autumn[language]) {
    const field = L.messages.autumn[language][i]
    const msg = document.createTextNode(field)
    p.appendChild(msg)
  }
  link.appendChild(p)
  return shrinkBoxMessage("tagSummary", link)
}

export function baby_photos(language) {
  const link = document.createElement('a')
  link.href = "#query/baby";
  const p = document.createElement('p')
  for (const i in L.messages.baby_photos[language]) {
    const field = L.messages.baby_photos[language][i]
    const msg = document.createTextNode(field)
    p.appendChild(msg)
  }
  link.appendChild(p)
  return shrinkBoxMessage("tagSummary", link)
}

export function birthday(name, animalId, years, language) {
  const link = document.createElement('a')
  link.href = `#panda/${animalId}`
  const p = document.createElement('p')
  for (const i in L.messages.happy_birthday[language]) {
    let field = L.messages.happy_birthday[language][i]
    if (field == "<INSERTNAME>") {
      field = name
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    } else if (field == "<INSERTNUMBER>") {
      field = years
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    } else {
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    }
  }
  link.appendChild(p)
  return shrinkBoxMessage("birthdaySummary", link)
}

export function birthday_overflow(count, language) {
  const p = document.createElement('p')
  p.className = "summaryEmphasis"
  for (const i in L.messages.birthday_overflow[language]) {
    let field = L.messages.birthday_overflow[language][i]
    if (field == "<INSERTCOUNT>") {
      field = count
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    } else {
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    }
  }
  return shrinkBoxMessage("birthdaySummary", p)
}

export function closed(date, language) {
  const p = document.createElement('p');
  for (const i in L.messages.closed[language]) {
    let field = L.messages.closed[language][i]
    if (field == "<INSERTDATE>") {
      field = date
      const msg = document.createTextNode(field);
      p.appendChild(msg)
    } else {
      const msg = document.createTextNode(field);
      p.appendChild(msg)
    }
  }
  return p
}

export function credit(credit, count, language) {
  // Draw a header for crediting someone's photos contribution 
  // with the correct language
  const p = document.createElement('p')
  for (const i in L.messages.credit[language]) {
    let field = L.messages.credit[language][i]
    if (field == "<INSERTUSER>") {
      field = credit
      const msg = document.createElement('i')
      msg.innerText = field
      p.appendChild(msg)
    } else if (field == "<INSERTNUMBER>") {
      field = count
      const msg = document.createElement('b')
      msg.innerText = field
      p.appendChild(msg)
    } else if ((field == L.emoji.gift + " ") && (count >= 1000)) {
      field = L.emoji.megagift + " "
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    } else {
      var msg = document.createTextNode(field)
      p.appendChild(msg)
    }
  }
  return shrinkBoxMessage("creditSummary", p)
}

export function creditSingleFilter(credit, filter, count, language) {
  // Draw a header for crediting someone's photos contribution 
  // with the correct language
  filter = Language.capitalNames(filter)
  const p = document.createElement('p')
  for (const i in L.messages.credit_animal_filter_single[language]) {
    let field = L.messages.credit_animal_filter_single[language][i]
    if (field == "<INSERTUSER>") {
      field = credit
      const msg = document.createElement('i')
      msg.innerText = field
      p.appendChild(msg)
    } else if (field == "<INSERTNUMBER>") {
      field = count
      const msg = document.createElement('b')
      msg.innerText = field
      p.appendChild(msg)
    } else if (field == "<INSERTNAME>") {
      field = filter
      const msg = document.createElement('b')
      msg.innerText = field
      p.appendChild(msg)
    } else {
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    }
  }
  return shrinkBoxMessage("creditSummary", p)
}

export function departed_to_zoo(zoo, date, language) {
  // Text to go into the Show.zooLink function
  let text = "";
  for (const i in L.messages.departed_to_zoo[language]) {
    let field = L.messages.departed_to_zoo[language][i]
    if (field == "<INSERTDATE>") {
      field = date
      text = text + field
    } else if (field == "<INSERTZOO>") {
      field = zoo
      text = text + field
    } else {
      text = text + field
    }
  }
  return text
}

export function departures(zoo, deaths, leaving, language) {
  // Zoo search: display departing animals along with ones that died.
  // If any animals passed away, this message gets a rainbow icon suffix
  const link = document.createElement('a');
  link.href = "javascript:";
  const linkId = `departures/zoo/${zoo["_id"]}`
  link.id = linkId
  link.addEventListener("click", function() {
    document.getElementById(linkId).scrollIntoView(true)
  })
  const p = document.createElement('p')
  for (const i in L.messages.zoo_header_recently_departed[language]) {
    const field = L.messages.zoo_header_recently_departed[language][i]
    const msg = document.createTextNode(field)
    p.appendChild(msg)
  }
  if ((deaths.length > 0) && (leaving.length == deaths.length)) {
    const suffix = document.createTextNode(" " + Language.L.emoji.died)
    p.appendChild(suffix)
  }
  link.appendChild(p)
  return shrinkBoxMessage("departuresHeader", link)
}

export function findNearbyZoo(language) {
  const link = document.createElement('a')
  link.href = "#query/nearby"
  const p = document.createElement('p')
  p.className = "summaryEmphasis"
  for (const i in L.messages.find_a_nearby_zoo[language]) {
    const field = L.messages.find_a_nearby_zoo[language][i]
    const msg = document.createTextNode(field)
    p.appendChild(msg)
  }
  link.appendChild(p)
  return shrinkBoxMessage("frontPageSummary", link)
}

export function foundAnimal(name, animalId, language) {
  const link = document.createElement('a')
  link.href = `#panda/${animalId}`
  const p = document.createElement('p')
  for (const i in L.messages.found_animal[language]) {
    let field = L.messages.found_animal[language][i]
    if (field == "<INSERTNAME>") {
      field = name
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    } else {
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    }
  }
  link.appendChild(p)
  return shrinkBoxMessage("memorialSummary", link)
}

export function geolocationStart(language) {
  const p = document.createElement('p')
  for (const i in L.messages.nearby_zoos[language]) {
    const field = L.messages.nearby_zoos[language][i]
    const msg = document.createTextNode(field);
    p.appendChild(msg);
  }
  return shrinkBoxMessage("frontPageSummary", p)
}

export function lostAnimal(name, animalId, zooName, zooContact, language) {
  const link = document.createElement('a')
  link.href = `#profile/${animalId}`
  const p = document.createElement('p')
  for (const i in L.messages.lost_animal[language]) {
    let field = L.messages.lost_animal[language][i]
    if (field == "<INSERTNAME>") {
      field = name
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    } else if (field == "<ZOONAME>") {
      field = zooName
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    } else if (field == "<ZOOCONTACT>") {
      field = zooContact
      const b = document.createElement('b')
      const msg = document.createTextNode(field)
      b.appendChild(msg)
      p.appendChild(b)
    } else {
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    }
  }
  link.appendChild(p)
  return shrinkBoxMessage("memorialSummary", link)
}

export function lunch_time(language) {
  const link = document.createElement('a')
  link.href = "#query/lunch time"
  const p = document.createElement('p')
  for (const i in L.messages.lunch_time[language]) {
    const field = L.messages.lunch_time[language][i]
    const msg = document.createTextNode(field)
    p.appendChild(msg)
  }
  link.appendChild(p)
  return shrinkBoxMessage("tagSummary", link)
}

export function memorial(name, animalId, birth, death, language) {
  const link = document.createElement('a')
  link.href = `#panda/${animalId}`
  const p = document.createElement('p')
  for (const i in L.messages.goodbye[language]) {
    let field = L.messages.goodbye[language][i]
    if (field == "<INSERTNAME>") {
      field = name
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    } else if (field == "<INSERTBIRTH>") {
      field = birth
      var msg = document.createTextNode(field)
      p.appendChild(msg)
    } else if (field == "<INSERTDEATH>") {
      field = death
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    } else {
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    }
  }
  link.appendChild(p);
  return shrinkBoxMessage("memorialSummary", link)
}

 export function memorialGroup(nameString, idString, language) {
  const link = document.createElement('a')
  link.href = `#group/${idString}`
  const p = document.createElement('p')
  for (const i in L.messages.remembering_you_together[language]) {
    let field = L.messages.remembering_you_together[language][i]
    if (field == "<INSERTNAMES>") {
      field = nameString
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    } else {
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    }
  }
  link.appendChild(p)
  return shrinkBoxMessage("memorialSummary", link)
}

export function missing_you(name, animalId, birth, death, language) {
  const link = document.createElement('a')
  link.href = `#panda/${animalId}`
  const p = document.createElement('p')
  for (const i in L.messages.missing_you[language]) {
    let field = L.messages.missing_you[language][i]
    if (field == "<INSERTNAME>") {
      field = name
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    } else if (field == "<INSERTBIRTH>") {
      field = birth
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    } else if (field == "<INSERTDEATH>") {
      field = death
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    } else {
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    }
  }
  link.appendChild(p)
  return shrinkBoxMessage("memorialSummary", link)
}

export function new_photos(language) {
  // TODO ES6
  // Grab update counts
  const counts = {
    "contributors": P.db._totals.updates.authors,
    "entities":  P.db._totals.updates.entities,
    "photos": P.db._totals.updates.photos,
    "suffix": 1,   // HACK
    "pandas": P.db._totals.updates.pandas,
    "zoos": P.db._totals.updates.zoos
  }
  if (counts["zoos"] == 0 && 
      counts["entities"] == 0 && 
      counts["photos"] == 0 &&
      counts["pandas"] == 0) {
    return document.createElement('br')   // No message to display
  }
  // Zoo counts are too much information
  const section_order = []
  if (counts["pandas"] > 0 && counts["photos"] > 0) {
    section_order = ["pandas", "photos", "suffix"]
  } else if (counts["pandas"] > 0 ) {
    section_order = ["pandas", "contributors", "suffix"]
  } else if (counts["contributors"] > 0) {
    section_order = ["contributors", "photos", "suffix"]
  } else {
    section_order = ["photos", "suffix"]
  }
  const lookup = Language.L.messages.new_photos
  const pieces = []
  for (const part of section_order) {
    const count = counts[part];
    if (count == 0) {
      continue
    }
    let output = ""
    const message = lookup[part][language]
    for (const i in message) {
      const field = message[i]
      if (field == "<INSERTCOUNT>") {
        output = output + count
      } else {
        output = output + field
      }
    }
    pieces.push(output)
  }
  pieces = Language.unpluralize(pieces)
  // Build a string out of phrases with commas + &
  const p = Language.commaPhrase(pieces)
  p.className = "updatePhotosMessage"
  return shrinkBoxMessage("frontPageSummary", p)
}

export function profile_children(name, childrenCount, daughters, sons, language) {
  const p = document.createElement('p');
  let babies = 0
  if (childrenCount != daughters + sons) {
    babies = childrenCount - daughters - sons;
  }
  // Choose the type of message
  let message = undefined;
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
  let output_text = ""
  // Do string replacement
  for (const i in message[language]) {
    const field = message[language][i];
    if (field == "<INSERTNAME>") {
      output_text = output_text.concat(name);
    } else if (field == "<INSERTTOTAL>") {
      output_text = output_text.concat(childrenCount);
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
  output_text = Language.unpluralize([output_text])[0]
  p.appendChild(document.createTextNode(output_text))
  return shrinkBoxMessage("profileSummary", p)
}

export function profile_family(name, language) {
  const p = document.createElement('p');
  for (const i in L.messages.profile_family[language]) {
    const field = L.messages.profile_family[language][i]
    if (field == "<INSERTNAME>") {
      const msg = document.createTextNode(name)
      p.appendChild(msg)
    } else {
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    }
  }
  // Fix s's if it appears
  const innerText = p.innerText;
  p.innerText = innerText.replace("s's", "s'")
  return shrinkBoxMessage("profileSummary", p)
}

export function profile_siblings(name, siblingCount, sisters, brothers, language) {
  const p = document.createElement('p')
  let babies = 0
  if (siblingCount != sisters + brothers) {
    babies = siblingCount - sisters - brothers
  }
  // Choose the type of message
  let message = undefined
  if (sisters > 0 && brothers > 0 && babies > 0) {
    message = L.messages.profile_siblings_babies
  } else if (sisters > 0 && brothers > 0) {
    message = L.messages.profile_siblings
  } else if (sisters > 0 && babies > 0) {
    message = L.messages.profile_sisters_babies
  } else if (brothers > 0 && babies > 0) {
    message = L.messages.profile_brothers_babies
  } else if (sisters > 0) {
    message = L.messages.profile_sisters
  } else if (brothers > 0) {
    message = L.messages.profile_brothers
  } else if (babies > 0) {
    message = L.messages.profile_babies_siblings
  } else {
    message = L.messages.profile_siblings
  }
  let output_text = ""
  for (const i in message[language]) {
    const field = message[language][i]
    if (field == "<INSERTNAME>") {
      output_text = output_text.concat(name)
    } else if (field == "<INSERTTOTAL>") {
      output_text = output_text.concat(siblingCount)
    } else if (field == "<INSERTSISTERS>") {
      output_text = output_text.concat(sisters)
    } else if (field == "<INSERTBROTHERS>") {
      output_text = output_text.concat(brothers)
    } else if (field == "<INSERTBABIES>") {
      output_text = output_text.concat(babies)
    } else {
      output_text = output_text.concat(field)
    }
  }
  output_text = Language.unpluralize([output_text])[0]
  p.appendChild(document.createTextNode(output_text))
  return shrinkBoxMessage("profileSummary", p)
}

export function profile_where(name, language) {
  const p = document.createElement('p')
  for (const i in L.messages.profile_where[language]) {
    const field = L.messages.profile_where[language][i]
    if (field == "<INSERTNAME>") {
      const msg = document.createTextNode(name)
      p.appendChild(msg)
    } else {
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    }
  }
  return shrinkBoxMessage("profileSummary", p)
}

export function residents(zoo, language) {
  // Zoo search: display a header for the resident animals
  // that didn't recently leave or arrive
  const link = document.createElement('a')
  link.href = "javascript:"
  const linkId = `residents/zoo/${zoo["_id"]}`
  link.id = linkId
  link.addEventListener("click", function() {
    document.getElementById(linkId).scrollIntoView(true)
  })
  // TODO ES6
  const info = Show.acquireZooInfo(zoo, language)
  const p = document.createElement('p')
  for (const i in L.messages.zoo_header_other_pandas[language]) {
    const field = L.messages.zoo_header_other_pandas[language][i]
    if (field == "<INSERTZOO>") {
      const msg = document.createTextNode(info.name)
      p.appendChild(msg)
    } else {
      const msg = document.createTextNode(field)
      p.appendChild(msg)
    }
  }
  link.appendChild(p)
  return shrinkBoxMessage("residentsHeader", p)
}

export function shovel_pandas(language) {
  const link = document.createElement('a')
  link.href = "#query/dig"
  const p = document.createElement('p')
  for (const i in L.messages.shovel_pandas[language]) {
    const field = L.messages.shovel_pandas[language][i]
    const msg = document.createTextNode(field)
    p.appendChild(msg)
  }
  link.appendChild(p)
  return shrinkBoxMessage("tagSummary", link)
}

export function tag_combo(num, emojis, language) {
  const p = document.createElement('p');
  // Emojis come first!
  for (const emoji of emojis) {
    p.appendChild(document.createTextNode(emoji + " "));
  }
  let output_text = "";
  for (const i in L.messages.tag_combo[language]) {
    let field = L.messages.tag_combo[language][i];
    if (field == "<INSERTNUM>") {
      output_text = output_text.concat(num);
    } else {
      if (num == 1) {
        field = Language.unpluralize([field]);
      }
      output_text = output_text.concat(field);
    }
  }
  output_text = Language.unpluralize([output_text])[0]
  p.appendChild(document.createTextNode(output_text))
  return shrinkBoxMessage("tagSummary", p)
}

export function tag_object(num, name, emoji, tag, language) {
  // If there was an id as part of a tagExpression, rewrite this message
  // using the panda's localized name instead.
  if (Pandas.checkId(name) == true) {
    name = Pandas.searchPandaId(name)[0][language + ".name"]
  }
  if (name != undefined) {
    name = Language.capitalNames(name)
  }
  // For translating a tag between languages, we need the first value in
  // the array of tags considered equivalent.
  // Need to look up "baby" info as well from the polyglot list of things
  // that can be either keywords or tags.
  let near_tag = undefined
  if (tag in Language.L.tags) {
    near_tag = Language.L.tags[tag][language][0]
  } else {
    near_tag = Language.L.polyglots[tag][language][0]
  }
  const p = document.createElement('p');
  for (const i in L.messages.tag_subject[language]) {
    let field = L.messages.tag_subject[language][i]
    if (field == "<INSERTNUM>") {
      const msg = document.createTextNode(num)
      p.appendChild(msg);
    } else if (field == "<INSERTNAME>") {
      const msg = document.createElement('i')
      const text = document.createTextNode(name)
      if (name != undefined) {
        msg.appendChild(text)
        p.appendChild(msg)
      }
    } else if (field == "<INSERTEMOJI>") {
      const msg = document.createTextNode(emoji)
      p.appendChild(msg)
    } else if (field == "<INSERTTAG>") {
      const msg = document.createElement('b')
      const text = document.createTextNode(near_tag)
      msg.appendChild(text)
      p.appendChild(msg)
    } else {
      if (num == 1) {
        field = Language.unpluralize([field])
      }
      const msg = document.createTextNode(field)
      if ((language == "ja") && (i == 1) && (name == undefined)) {
        msg = document.createTextNode("枚")
      }
      p.appendChild(msg)
    }
  }
  return shrinkBoxMessage("tagSummary", p)
}

export function trick_or_treat(language) {
  const link = document.createElement('a')
  link.href = "#query/pumpkin"
  const p = document.createElement('p')
  for (const i in L.messages.trick_or_treat[language]) {
    const field = L.messages.trick_or_treat[language][i]
    const msg = document.createTextNode(field)
    p.appendChild(msg)
  }
  link.appendChild(p)
  return shrinkBoxMessage("halloweenSummary", link)
}

/** Messages that spit out a visible div box in the broader UX */
function shrinkBoxMessage(messageClass, shrinkerChild) {
  const shrinker = document.createElement('div')
  shrinker.className = "shrinker"
  shrinker.appendChild(shrinkerChild)
  const message = document.createElement('div')
  message.className = messageClass
  message.appendChild(shrinker)
  return message
}
