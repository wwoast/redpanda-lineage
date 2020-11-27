#!/usr/bin/python3

# This Red Panda Lineage dataset builder takes all source input data and
# creates a JSON file intended for family tree querying.

import configparser
import datetime
import git
import json
import os
import re
import sys
import time

from shared import *
from unidiff import PatchSet


class RedPandaGraph:
    """Class with the redpanda database and format/consistency checks.

    The database is an array of vertices and edges in the graph of red panda
    relationships. A supplemental list of zoos rounds out the red panda data.
    Upon export, these arrays of dicts become a JSON blob.
        
    Vertices represent a panda and their info, while edges represent parent
    and child relationships between animals. In the example below, Karin is
    Harumaki's mom:
      
    { vertices: [{ "_id":1,"en.name":"Harumaki", ...},
                 { "_id":10,"en.name":"Karin", ...}],
      edges: [{"_out":10,"_in":1,"_label":"family"}]}
    """
    def __init__(self):
        self.edges = []
        self.links = []
        self.links_files = []
        self.lexer_names = []   # Complex names with spaces
        self.media = []
        self.media_files = []
        self.panda_files = []
        self.photo = {}
        self.photo["credit"] = {}
        self.photo["max"] = 0
        self.photo["group"] = 0
        self.summary = {}
        self.summary["birthday"] = 1970
        self.summary["death"] = 1970
        self.vertices = []
        self.updates = {}
        self.wilds = []
        self.wild_files = []
        self.zoos = []
        self.zoo_files = []

    def build_graph(self):
        """Reads in all files to build a red panda graph."""
        self.import_tree(ZOO_PATH, self.import_zoo, self.verify_zoos)
        self.import_tree(WILD_PATH, self.import_wild, self.verify_wilds)
        self.import_tree(PANDA_PATH, self.import_redpanda, self.verify_pandas)
        self.import_tree(MEDIA_PATH, self.import_media, self.verify_media)
        self.import_tree(LINKS_PATH, self.import_links, self.verify_links)

    def check_dataset_dates(self):
        """Run checks against the complete tree of red panda dates.

        - Birth date and date of death should not be reversed.
        - Child pandas should not be born before the parent.
        - Child pandas should not be born after the parent died.

        This requires the entire panda dataset to have been read.
        """
        # TODO: graph traverse and date checking
        pass

    def check_dataset_children_ids(self):
        """Check the panda children IDs to ensure they form a family tree.

        - The children IDs should be valid for only one red panda file
        - There should be no loops / I'm my own grandpa situations
        - Each child should have a mother and a father

        This requires the entire children edge dataset to have been read.
        We make stacks of child -> parent -> grandparent ... paths,
        and look for any duplicate IDs in the stacks.

        Only run this check on nodes just added to the dataset.
        """
        # Start with the set of pandas that have no children
        childless_ids = [p['_id'] for p in self.vertices
                       if (p['children'] == "none" 
                           or p['children'] == "unknown")]
        # Finish with the pandas that have no recorded parents
        all_child_ids = [x['_out'] for x in self.edges]
        parentless_ids = [y for y in range(1, self.sum_pandas())
                            if y not in all_child_ids]
        # Sets of edges we can start or finish on
        starting_edges = [s for s in self.edges 
                            if s['_out'] in childless_ids]
        finishing_edges = [f for f in self.edges
                             if f['in'] in parentless_ids]
        # This is hard to write :)
        pass

    def check_dataset_litter_ids(self):
        """Check that pandas in the same litter have the same birthday."""
        litter_edges = [a for a in self.edges if a['_label'] == "litter"]
        seen_pairs = []
        for edge in litter_edges:
            if (edge['_in'], edge['_out']) not in seen_pairs:
                try:
                    panda_in = [p for p in self.vertices 
                                  if p['_id'] == edge['_in']][0]
                    panda_out = [p for p in self.vertices 
                                   if p['_id'] == edge['_out']][0]
                except IndexError as e:
                    # One panda in a litter isn't pointing back at the other
                    raise LinkError("""Litter values inconsistent between two pandas,
                                       \nor one panda ID is not in the database: %s""" % edge)
                if self.check_dataset_litter_timeframes(panda_in['birthday'], panda_out['birthday']) == False:
                    raise DateConsistencyError("Pandas in litter don't share birthday: %s, %s"
                                               % (panda_in['en.name'], panda_out['en.name']))
            # Litter relationships are recorded both directions, but we don't need
            # to check the reverse-direction litter relationship
            seen_pairs.append((edge['_in'], edge['_out']))
            seen_pairs.append((edge['_out'], edge['_in']))
        pass

    def check_dataset_litter_timeframes(self, date_one, date_two):
        """Valid litter dates are no more than two days apart."""
        if (date_one == "unknown" or date_two == "unknown"):
            # Assume wild-caught litters with unknown birthdays are documented ok
            return True
        [ year_one, month_one, day_one ] = date_one.split("/")
        [ year_two, month_two, day_two ] = date_two.split("/")
        dt_one = datetime.datetime(int(year_one), int(month_one), int(day_one))
        dt_two = datetime.datetime(int(year_two), int(month_two), int(day_two))
        diff = dt_one - dt_two
        if abs(diff.days) > 2:
            return False
        else:
            return True 

    def check_dataset_duplicate_ids(self, dataset):
        """Check for duplicate IDs in any of the datasets."""
        ids = [a['_id'] for a in dataset]
        # Construct list of duplicates
        dupe_ids = [a for n, a in enumerate(ids) 
                      if a in ids[:n]]
        if len(dupe_ids) > 0:
            # Get list of names for the duplicate pandas
            dupe_names = [a['en.name'] for a in dataset 
                                       if a['_id'] in dupe_ids]
            raise IdError("ERROR: duplicate ids for en.names: %s" 
                          % str(dupe_names)) 

    def check_imported_author(self, author, field_name, sourcepath):
        """Validate that a link isn't in the author field by accident."""
        if ("http://" in author or "https://" in author):
            raise AuthorError("ERROR: %s: %s should not be a URL: %s"
                              % (sourcepath, field_name, author))

    def check_imported_birthday_consistency(self, infile):
        """
        The birthday field and location.1 field dates should always match.
        Animals that haven't moved don't need to worry about this consistency.
        """
        birthday = infile.get("panda", "birthday", fallback=None)
        location = infile.get("panda", "location.1", fallback=None)
        panda_id = infile.get("panda", "_id")
        panda_name = infile.get("panda", "en.name")
        if birthday == None:
            return   # No birthday being tracked
        if birthday == "unknown":
            return   # Can't validate the birthday properly
        if location == None:
            return   # Animal hasn't ever moved, so no checks necessary
        if location.find(", ") == -1:
            return   # Location has no birthday to validate
        if location.find(", ") == -1 and birthday != "unknown":
            raise DateConsistencyError("Panda has valid birthday not mirrored in location.1 field: %s, %s"
                                        % (panda_id, panda_name))
        else:
            location = location.split(", ")[1]   # Date after the comma-space
            if birthday != location:
                raise DateConsistencyError("location.1 and birthday don't match for panda: %s, %s"
                                            % (panda_id, panda_name))

    def check_imported_date(self, date, date_type, sourcepath):
        """
        Dates should all be in the form of YYYY/MM/DD.
        Also, track most recent year that a panda was born or died (datetype).
        """
        try:
            [year, month, day] = date.split("/")
            datetime.datetime(int(year), int(month), int(day))
            if self.summary[date_type] < int(year):
                self.summary[date_type] = int(year)
        except ValueError as e:
            raise DateFormatError("ERROR: %s: invalid YYYY/MM/DD date: %s/%s/%s"
                                  % (sourcepath, year, month, day))

    def check_imported_gender(self, gender, sourcepath):
        """Validate the gender string is correct.

        Allowed strings are one of: 
           m, f, M, F, male, female, オス, or メス

        The gender strings will be cast into just "Male" or "Female", so that
        the website can choose which language to display this data in.
        """
        if gender in ["m", "M", "male", "Male", "オス"]:
            return "Male"
        elif gender in ["f", "F", "female", "Female", "メス"]:
            return "Female"
        else:
            raise GenderFormatError("ERROR: %s: unsupported gender: %s" 
                                    % (sourcepath, gender))

    def check_imported_name(self, name, field, sourcepath):
        """Ensure the name strings are not longer than 80 characters.
    
        This limitation applies to zoos, pandas, and other details, and is
        intended to make text formatting simpler.
        """
        if len(name) > 100:
            raise NameFormatError("ERROR: %s: %s name too long: %s"
                                  % (sourcepath, field, name))
    
    def check_imported_wild_id(self, wild_id, sourcepath):
        """Validate that the ID for a panda's zoo is valid."""
        if wild_id not in [wild['_id'] for wild in self.wilds]:
            raise IdError("ERROR: %s: wild id doesn't exist: %s"
                              % (sourcepath, wild_id))

    def check_imported_panda_wild_path(self, wild_id, sourcepath):
        """Validate that we didn't mis-number a panda's wild id given which directory it sits in."""
        if wild_id not in sourcepath:
            raise IdError("ERROR: %s: file path and wild id don't match: %s"
                              % (sourcepath, wild_id))

    def check_imported_zoo_id(self, zoo_id, sourcepath):
        """Validate that the ID for a panda's zoo is valid."""
        check_id = str(int(zoo_id) * -1)
        if check_id not in [zoo['_id'] for zoo in self.zoos]:
            raise IdError("ERROR: %s: zoo id doesn't exist: %s"
                              % (sourcepath, zoo_id))

    def check_imported_panda_zoo_path(self, zoo_id, sourcepath):
        """Validate that we didn't mis-number a panda's wild id given which directory it sits in."""
        if zoo_id not in sourcepath:
            raise IdError("ERROR: %s: file path and zoo id don't match: %s"
                              % (sourcepath, zoo_id))

    def export_json_graph(self, destpath):
        """Write a JSON representation of the Red Panda graph."""
        export = {}
        export['vertices'] = self.vertices
        export['edges'] = self.edges
        export['_lexer'] = {}
        export['_lexer']['names'] = sorted(self.lexer_names)
        export['_photo'] = {}
        export['_photo']['credit'] = self.photo['credit']
        export['_photo']['entity_max'] = self.photo['max']
        export['_photo']['group_max'] = self.photo['group']
        export['_totals'] = {}
        export['_totals']['credit'] = len(self.photo['credit'].keys())
        export['_totals']['last_born'] = self.summary['birthday']
        export['_totals']['last_died'] = self.summary['death']
        export['_totals']['media'] = len(self.media)
        export['_totals']['pandas'] = self.sum_pandas()
        export['_totals']['locations'] = len(self.wilds) + len(self.zoos)
        export['_totals']['updates'] = {}
        export['_totals']['updates']['authors'] = self.updates['author_count']
        export['_totals']['updates']['entities'] = len(self.updates['entities'])
        export['_totals']['updates']['pandas'] = self.updates['panda_count']
        export['_totals']['updates']['photos'] = len(self.updates['photos'])
        export['_totals']['updates']['zoos'] = self.updates['zoo_count']
        export['_totals']['wilds'] = len(self.wilds)
        export['_totals']['zoos'] = len(self.zoos)
        export['_updates'] = {}
        export['_updates']['authors'] = self.updates['authors']
        export['_updates']['entities'] = self.updates['entities']
        export['_updates']['photos'] = self.updates['photos']

        with open(destpath, 'wb') as wfh:
            wfh.write(json.dumps(export, 
                                 ensure_ascii=False,
                                 indent=4,
                                 sort_keys=True).encode('utf8'))
        print("Dataset exported: %d pandas at %d locations (%d wild, %d zoo)"
              % (export['_totals']['pandas'], export['_totals']['locations'],
                 export['_totals']['wilds'], export['_totals']['zoos']))

    def import_tree(self, path, import_method, verify_method):
        """Given starting path, import all files into the graph.
        
        By adjusting path and import_method, this is used to import either the
        panda data or the zoo data.
        """
        for _, subdir in enumerate(sorted(os.listdir(path))):
            subpath = os.path.join(path, subdir)
            if os.path.isfile(subpath) and subpath.lower().endswith(".txt"):
                # Import links
                import_method(subpath)
            elif os.path.isdir(subpath):
                for _, subfile in enumerate(sorted(os.listdir(subpath))):
                    subsubpath = os.path.join(subpath, subfile)
                    if os.path.isfile(subsubpath) and subsubpath.lower().endswith(".txt"):
                        # Import zoos
                        import_method(subsubpath)
                    if os.path.isdir(subsubpath):
                        for _, subsubfile in enumerate(sorted(os.listdir(subsubpath))):
                            datapath = os.path.join(subsubpath, subsubfile)
                            if os.path.isfile(datapath) and datapath.lower().endswith(".txt"):
                                # Import pandas or media
                                import_method(datapath)
        # Post-import, validate the entire dataset
        verify_method()

    def import_links(self, path):
        """Take a single links file and convert it into a Python dict.

        Links files are expected to have a header of [links]. Any fields defined
        under that header will be consumed into a list of links.
        """
        links_vertex = {}
        infile = configparser.ConfigParser()
        infile.read(path, encoding='utf-8')
        # Use the path name for error messages or assignments
        for field in infile.items("links"):
            links_vertex[field[0]] = field[1]
        self.links.append(links_vertex)
        self.vertices.append(links_vertex)
        self.links_files.append(path)

    def import_media(self, path):
        """Take a single media file and convert it into a Python dict.

        Media files are expected to have a header of [media]. Any fields defined
        under that header will be consumed into a list of photos or videos. All
        of these media files should have two or more pandas in them.
        """
        media_vertex = {}
        infile = configparser.ConfigParser()
        infile.read(path, encoding='utf-8')
        # Use the path name for error messages or assignments
        for field in infile.items("media"):
            if (field[0].find("photo") != -1 and
                len(field[0].split(".")) == 2):
                    # Process a small set of photo credits for all the pandas
                    author = infile.get("media", field[0] + ".author")
                    if author in self.photo["credit"].keys():
                       self.photo["credit"][author] = self.photo["credit"][author] + 1
                    else:
                       self.photo["credit"][author] = 1
                    # Track what the max number of panda photos an object has is
                    # test_count = int(field[0].split(".")[1])
                    # if test_count > self.photo["max"]:
                    #    self.photo["max"] = test_count
                    # Accept the data and continue
                    media_vertex[field[0]] = field[1]
            elif (field[0] == "panda.tags"):
                # Track largest number of pandas in a single photo
                id_list = field[1].split(", ")
                if len(id_list) > self.photo["group"]:
                    self.photo["group"] = len(id_list)
                # Accept data and continue
                media_vertex[field[0]] = field[1]
            # TODO: track video info for apple counting as well
            else:
                # Accept the data and move along
                media_vertex[field[0]] = field[1]
        self.media.append(media_vertex)
        self.vertices.append(media_vertex)
        self.media_files.append(path)

    def import_redpanda(self, path):
        """Take a single red panda file and convert it into a Python dict.

        Panda files are expected to have a header of [panda]. Any fields defined
        under that header will be consumed into the pandas datastore. 
        
        Fields with specific formats, like dates or names or ids, get validated
        upon importing. This includes making sure birthplace and zoo refer to 
        valid zoos. Relationship fields or panda ID checks are deferred until
        the entire set of panda data is imported.

        Since pandas live at zoos and we need to check zoo references, the list
        of zoos must be imported prior to any red pandas being imported. 
        """
        panda_edges = []
        panda_vertex = {}
        infile = configparser.ConfigParser()
        infile.read(path, encoding='utf-8')
        panda_name = infile.get("panda", "en.name")   # For error messages
        panda_id = infile.get("panda", "_id")         # or assignments
        for field in infile.items("panda"):
            if (field[0].find("death") != -1 or
                field[0].find("birthday") != -1):
                # Record that an animal has died or was born, 
                # regardless if the date has been recorded or not.
                if field[1] != "unknown":
                    self.check_imported_date(field[1], field[0], path)
                panda_vertex[field[0]] = field[1]
            if field[1] == "unknown" or field[1] == "none":
                # Basic null checks. Don't add this to the vertex
                continue
            elif field[0].find("name") != -1:
                # Name rule checking
                self.check_imported_name(field[1], field[0], path)
                panda_vertex[field[0]] = field[1]
                # If a name has spaces in it, track it to help search parsing
                self.process_lexer_names(field[1])
            elif field[0].find("gender") != -1:
                # Gender rules
                gender = self.check_imported_gender(field[1], path)
                panda_vertex[field[0]] = gender
            elif (field[0].find("birthplace") != -1):
                if (field[1].find("wild.") != -1):
                    # Wild ID rules
                    wild_id = field[1]
                    self.check_imported_wild_id(field[1], path)
                    # Add a wild edge to the list that's a wild location
                    wild_edge = {}
                    wild_edge['_out'] = panda_id
                    wild_edge['_in'] = wild_id
                    wild_edge['_label'] = field[0]
                    panda_edges.append(wild_edge)
                else:
                    # Zoo ID rules
                    # To differentiate Zoo IDs from pandas, use negative IDs
                    zoo_id = str(int(field[1]) * -1)
                    self.check_imported_zoo_id(field[1], path)
                    # Add a birthplace or zoo edge to the list that's a zoo
                    zoo_edge = {}
                    zoo_edge['_out'] = panda_id
                    zoo_edge['_in'] = zoo_id
                    zoo_edge['_label'] = field[0]
                    panda_edges.append(zoo_edge)
            elif field[0].find("children") != -1:
                # Partial parentage info
                if field[1].find("/") != -1:
                    children = field[1].split(",")
                    for child_possible in children:
                        # keep inner whitespace
                        child_possible = child_possible.strip()
                        child_id = child_possible.split(" ")[0]
                        child_percent = child_possible.split(" ")[-1]
                        panda_edge = {}
                        panda_edge['_out'] = panda_id
                        panda_edge['_in'] = child_id
                        panda_edge['_label'] = "family"
                        panda_edge['probability'] = child_percent
                        panda_edges.append(panda_edge)
                # Process children IDs
                else:
                    children = field[1].replace(" ","").split(",")
                    for child_id in children:
                        panda_edge = {}
                        panda_edge['_out'] = panda_id
                        panda_edge['_in'] = child_id
                        panda_edge['_label'] = "family"
                        panda_edges.append(panda_edge)
            elif field[0].find("litter") != -1:   
                # Process whether pandas were in the same litter or not
                litter = field[1].replace(" ","").split(",")
                for sibling_id in litter:
                    panda_edge = {}
                    panda_edge['_out'] = panda_id
                    panda_edge['_in'] = sibling_id
                    panda_edge['_label'] = "litter"
                    panda_edges.append(panda_edge)
            elif (field[0].find("photo") != -1 and
                  len(field[0].split(".")) == 2):
                # Process a small set of photo credits for all the pandas
                author = infile.get("panda", field[0] + ".author")
                self.check_imported_author(author, field[0], path)
                if author in self.photo["credit"].keys():
                    self.photo["credit"][author] = self.photo["credit"][author] + 1
                else:
                    self.photo["credit"][author] = 1
                    # If author name has spacies in it, add to the lexer list
                    self.process_lexer_names(author)
                # Track what the max number of panda photos an object has is
                test_count = int(field[0].split(".")[1])
                if test_count > self.photo["max"]:
                    self.photo["max"] = test_count
                # Accept the data and continue
                panda_vertex[field[0]] = field[1]
            elif (field[0].find("wild") != -1):
                # Wild ID rules
                wild_id = field[1]
                self.check_imported_wild_id(field[1], path)
                self.check_imported_panda_wild_path(field[1], path)
                # Add a wild edge to the list that's a wild location
                wild_edge = {}
                wild_edge['_out'] = panda_id
                wild_edge['_in'] = wild_id
                wild_edge['_label'] = field[0]
                panda_edges.append(wild_edge)
            elif (field[0].find("zoo") != -1):
                # Zoo ID rules
                # To differentiate Zoo IDs from pandas, use negative IDs
                zoo_id = str(int(field[1]) * -1)
                self.check_imported_zoo_id(field[1], path)
                self.check_imported_panda_zoo_path(field[1], path)
                # Add a birthplace or zoo edge to the list that's a zoo
                zoo_edge = {}
                zoo_edge['_out'] = panda_id
                zoo_edge['_in'] = zoo_id
                zoo_edge['_label'] = field[0]
                panda_edges.append(zoo_edge)
            else:
                # Accept the data and move along
                panda_vertex[field[0]] = field[1]
        # Per entity checks
        self.check_imported_birthday_consistency(infile)
        # If everything went well, extend the graph
        self.edges.extend(panda_edges)
        self.vertices.append(panda_vertex)
        self.panda_files.append(path)

    def import_wild(self, path):
        """Take a single wild location file and convert it into a Python dict.
        
        Wild files are expected to have a header of [wild]. Any fields defined
        under that header will be consumed into the wild datastore. Every panda
        must have a link to a zoo or a wild location.
        """
        wild_entry = {}
        infile = configparser.ConfigParser()
        infile.read(path, encoding='utf-8')
        for field in infile.items("wild"):
            # Use negative numbers for zoo IDs, to distinguish from pandas
            [ key, value ] = [field[0], field[1]]
            if (key.find("photo") != -1 and
                len(key.split(".")) == 2):
                author = infile.get("wild", key + ".author")
                if author in self.photo["credit"].keys():
                    self.photo["credit"][author] = self.photo["credit"][author] + 1
                else:
                    self.photo["credit"][author] = 1
            wild_entry[key] = value
        self.wilds.append(wild_entry)
        self.wild_files.append(path)
        self.vertices.append(wild_entry)
        
    def import_zoo(self, path):
        """Take a single zoo file and convert it into a Python dict.
        
        Zoo files are expected to have a header of [zoo]. Any fields defined
        under that header will be consumed into the zoo datastore. Every panda
        must have a link to a zoo or a wild location.
        """
        zoo_entry = {}
        infile = configparser.ConfigParser()
        infile.read(path, encoding='utf-8')
        for field in infile.items("zoo"):
            # Use negative numbers for zoo IDs, to distinguish from pandas
            [ key, value ] = [field[0], field[1]]
            if key == '_id':
                value = str(int(field[1]) * -1)
            elif (key.find("photo") != -1 and
                  len(key.split(".")) == 2):
                author = infile.get("zoo", key + ".author")
                if author in self.photo["credit"].keys():
                    self.photo["credit"][author] = self.photo["credit"][author] + 1
                else:
                    self.photo["credit"][author] = 1
            zoo_entry[key] = value
        self.zoos.append(zoo_entry)
        self.zoo_files.append(path)
        self.vertices.append(zoo_entry)

    def find_matching_edges(self, outp, inp, label):
        """Find matching edges in either direction.

        Ex: If _in=8 and _out=2, match either that edge or _in=2 and _out=8
        """
        return [a for a in self.edges
                if ((a['_label'] == label) and
                    ((a['_out'] == outp and a['_in'] == inp) or  
                     (a['_in'] == outp and a['_out'] == inp)))]

    def process_lexer_names(self, input):
        """
        The RPF front-end uses a LR parser with space as delimiter. We help
        it along by enumerating all input names for animals that have spaces
        in them, so that a lexer can preserve those names when they appear in
        the search input.
        
        Name fields may come in a few varieties -- just names, or commma-space
        delimited lists. Process this down to just a simple list.
        """
        input_list = input.split(", ")   # Make an array
        input_list = [x for x in input_list 
                        if x.count(" ") > 0
                        and not x in self.lexer_names]
        self.lexer_names.extend(input_list)
        
    def set_updates(self, updates):
        """
        In the UpdateFromCommits object, we build a list of new photos
        since the <previous> commit. Store that in the RedPandaGraph for
        when we do the export later.
        """
        self.updates = updates

    def sum_pandas(self):
        """Panda count is just the count of the number of panda files imported."""
        return len(self.panda_files)

    def verify_links(self):
        """All checks to ensure that the links vertices are good."""
        self.check_dataset_duplicate_ids(self.links)

    def verify_media(self):
        """All checks to ensure that the group media vertices are good."""
        self.check_dataset_duplicate_ids(self.media)

    def verify_pandas(self):
        """All checks to ensure that the panda dataset is good."""
        self.check_dataset_duplicate_ids(self.vertices)
        # self.check_dataset_children_ids()
        self.check_dataset_litter_ids()
        self.check_dataset_dates()

    def verify_wilds(self):
        """All checks to ensure that the zoo dataset is good."""
        self.check_dataset_duplicate_ids(self.wilds)

    def verify_zoos(self):
        """All checks to ensure that the zoo dataset is good."""
        self.check_dataset_duplicate_ids(self.zoos)

class UpdateFromCommits:
    """
    Take two Git commits in the repository, and process any additions
    as content that can be inserted into the front page. 
    
    Assumes that build.py is always ran at the root of the repository.
    """
    def __init__(self):
        self.current_time = int(time.time())
        self.repo = git.Repo(".")
        self.prior_commit = self._starting_commit(COMMIT_AGE)
        self.current_commit = self.repo.commit("HEAD")
        self.diff_raw = self.repo.git.diff(self.prior_commit, 
                                           self.current_commit,
                                           ignore_blank_lines=True,
                                           ignore_space_at_eol=True)
        self.patch = PatchSet(self.diff_raw)
        self.locator_to_photo = {}
        self.entity_to_commit_date = {}
        self.seen = {}
        self.seen["media"] = {}
        self.seen["panda"] = {}
        self.seen["photos"] = {}
        self.seen["wild"] = {}
        self.seen["zoo"] = {}
        self.updates = {}
        self.updates["authors"] = []
        self.updates["author_count"] = 0
        self.updates["entities"] = []
        self.updates["pandas"] = []
        self.updates["panda_count"] = 0
        self.updates["photos"] = []
        self.updates["zoos"] = []
        self.updates["zoo_count"] = 0
        self.create_updates()

    def count_new_photos(self):
        """
        Given the locator_to_photo map, check the commitdates of each photo.
        If it's older than a week, ignore it.
        """
        seen_uris = {}
        # Get list of changes per photo locator
        for locator in self.locator_to_photo.keys():
            uri = self.locator_to_photo[locator].photo_uri
            datestring = self.locator_to_photo[locator].commitdate
            if (seen_uris.get(uri) == None):
                seen_uris[uri] = datestring
        for uri in seen_uris.copy().keys():
            commitdate = datetime_to_unixtime(seen_uris[uri])
            lastweek = current_date_to_unixtime() - 604800   # Seconds in a week
            if commitdate < lastweek:
                # Filter out where commitdate of a photo is older than a week
                seen_uris.pop(uri)
        return seen_uris

    def create_updates(self):
        """
        Take the two listed commits, and make arrays of updates we can generate
        the updates section from. Also make unique counts of pandas and zoos added
        """
        # Grab the last JSON file for author data
        for change in self.patch:
            filename = change.path
            if filename.find(".txt") == -1:
                # Don't care about non-data files
                continue
            elif change.added <= 0:
                # Don't care about lines we removed
                continue
            elif os.path.exists(filename) == False:
                # Don't care about files removed
                continue
            else:
                # New photo. Track photo on its own
                for hunk in change:
                    for line in hunk:
                        if line.is_added:
                            self._process_raw_line(filename, line.value)
        # If this is a new panda, add it to our counts
        lastweek = current_date_to_unixtime() - 604800
        for panda_id in self.seen["panda"].keys():
            locators = self.seen["panda"][panda_id]
            commitdate = self.entity_to_commit_date["panda." + panda_id]
            commitstamp = datetime_to_unixtime(commitdate)
            if commitstamp > lastweek:
                self.updates["pandas"] = self.updates["pandas"] + locators
                self.updates["entities"] = self.updates["entities"] + locators
        # If this is a new zoo, add it to our counts
        for zoo_id in self.seen["zoo"]:
            locators = self.seen["zoo"][zoo_id]
            commitdate = self.entity_to_commit_date["zoo." + zoo_id]
            commitstamp = datetime_to_unixtime(commitdate)
            if commitstamp > lastweek:
                self.updates["zoos"] = self.updates["zoos"] + locators
                self.updates["entities"] = self.updates["entities"] + locators
        # If this is a new media item, add it to our counts. Media items
        # shouldn't move, but we give them commitdate fields anyways just
        # to keep the logic for newness checks consistent with other files.
        for media_id in self.seen["media"]:
            locators = self.seen["media"][media_id]
            commitdate = self.entity_to_commit_date["media." + media_id]
            commitstamp = datetime_to_unixtime(commitdate)
            if commitstamp > lastweek:
                self.updates["entities"] = self.updates["entities"] + locators
        panda_entities = [".".join(p.split(".")[0:2]) for p in self.updates["pandas"]]
        self.updates["panda_count"] = len(list(set(panda_entities)))
        zoo_entities = [".".join(z.split(".")[0:2]) for z in self.updates["zoos"]]
        self.updates["zoo_count"] = len(list(set(zoo_entities)))
        # Calculate the commitdates of all the photo locators themselves
        self.seen["photos"] = self.count_new_photos()
        for locator in self.locator_to_photo.copy().keys():
            if self.locator_to_photo[locator].photo_uri not in self.seen["photos"].keys():
                # Not in the counted new photo list, so remove it
                self.locator_to_photo.pop(locator)
        self.updates["photos"] = list(self.locator_to_photo.keys())
             
    def new_contributors(self, author_set):
        """
        Look at all added lines in the last diff. Then look at the author
        counts in the current redpanda.json export. If the number of photos
        by that author is the same as the number of photos in the changelog,
        they are a new contributor! Return a corresponding new contributor
        update for insertion into the current JSON.
        """
        author_diffs = {}
        author_entities = {}
        # Look at all locator_to_photos contributions. Filter on those that
        # just have "added" changes. Then compare against the number in
        # redpanda.json for how many photos theat
        for locator in self.locator_to_photo.keys():
            author = self.locator_to_photo[locator].author_name
            entity_commitdate = self.locator_to_photo[locator].entity_commitdate
            commitdate = self.locator_to_photo[locator].commitdate
            commitstamp = datetime_to_unixtime(commitdate)
            lastweek = current_date_to_unixtime() - 604800   # Seconds in a week
            if commitstamp >= lastweek:
                # Just an addition
                # print(locator + ": " + str(author) + ": " + str(commitdate) + " <:> " + str(entity_commitdate))
                if (author_diffs.get(author) == None):
                    author_diffs[author] = 0
                    author_entities[author] = []
                author_diffs[author] = author_diffs[author] + 1
                author_entities[author].append(locator)
        # Remove any author_entities where the diff count in the changelog
        # doesn't match the total count from the source data
        for author in author_diffs.copy().keys():
            if (author_diffs.get(author) == None or
                author_set.get(author) == None):
                # We removed a photo contributor
                author_entities.pop(author)
                author_diffs.pop(author)
                continue
            if author_diffs[author] != author_set[author]:
                # print(author + " diffs: " + str(author_diffs[author]) + 
                #       " set: " + str(author_set[author]))
                author_entities.pop(author)
                author_diffs.pop(author)
        # Now the author_entities list is just authors whose entities are
        # their only photos in redpandafinder. Make the authors list from this
        for entity_list in author_entities.values():
            # Handle cases where entities were moved and no longer valid locators
            entity_list = [e for e in entity_list if e != None]
            self.updates["authors"].extend(entity_list)
        # And get the count of unique authors added
        for author in author_diffs.copy().keys():
            if author_diffs[author] > 0:
                self.updates["author_count"] = self.updates["author_count"] + 1

    def _process_raw_line(self, filename, raw):
        """
        Annoying code where we use the PhotoEntry object to create locators
        for where an entity or a photo might already exist in our lookup
        caches for entities and photos.

        Add to the entity cache for files we haven't seen before, and add to
        the photo cache for lines representing a facet of a photo we haven't
        seen before.
        """
        # Match the actual photo lines that were added
        if re.match("photo.\d+:", raw) == None:
            return
        raw = raw.strip()
        # Create a stub photo entry to validate whether we've
        # read in an update from this file before
        photo = PhotoEntry(filename, raw)
        entity = photo.entity_locator()
        locator = photo.photo_locator()
        self.locator_to_photo[locator] = photo
        # Track which entities we've seen, as lists of photo locators
        if photo.entity_id not in self.seen[photo.entity_type]:
            self.seen[photo.entity_type][photo.entity_id] = []
            self.entity_to_commit_date[photo.entity_type + "." + photo.entity_id] = photo.entity_commitdate
        self.seen[photo.entity_type][photo.entity_id].append(locator)

    def _starting_commit(self, time_delta):
        """
        Given shared.py COMMIT_AGE lookback time, find the oldest commit
        within that COMMIT_AGE time period. Updates will be calculated based
        on whether the commit is in the POLICY time period.
        """
        oldest_time = self.current_time - time_delta
        oldest_commit = None
        for commit in self.repo.iter_commits():
            date = commit.committed_date
            if date < oldest_time:
                return oldest_commit
            else:
                oldest_commit = commit
        # If CI does a shallow clone, use the oldest commit we have
        return oldest_commit

def vitamin():
    """
    Based on a completed Red Panda database, and on the contents of all 
    Javascript and HTML sources here, build a unique set of characters for 
    display in the lineage interface. This character set is necessary to instruct 
    TypeSquare on which characters we want to download in our font.
    """
    vitamin = "&amp;&copy;&lsquo;&rsquo;&ldquo;&rdquo;&nacute;"  # &-encoded HTML characters to start
    lists = []
    manifest = [
        "export/redpanda.json",
        "index.html",
        "js/pandas.js",
        "js/show.js",
        "js/language.js",
        "fragments/en/about.html",
        "fragments/jp/about.html"
    ]
    for fn in manifest:
        with open(fn, 'r') as rfh:
            raw = rfh.read()
            lists += list(set(raw))  # Uniquify values
    lists = list(set(lists))   # Uniquify lists of values
    lists.sort()
    vitamin += ''.join(lists).replace("\n", "")
    page = ""
    with open("index.html", mode='r', encoding='utf-8') as rfh:
        page = rfh.read()
        page = page.replace('${vitamins}', vitamin)
    with open("index.html", mode='w', encoding="utf-8") as wfh:
        wfh.write(page)

if __name__ == '__main__':
    """Initialize all library settings, build, and export the database."""
    p = RedPandaGraph()
    p.build_graph()
    u = UpdateFromCommits()
    u.new_contributors(p.photo["credit"])
    p.set_updates(u.updates)
    p.export_json_graph(OUTPUT_PATH)
    # Only do this in CI when publishing a real page
    if len(sys.argv) > 1:
        if sys.argv[1] == "--publish":
            vitamin()
