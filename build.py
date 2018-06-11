#!/usr/bin/python3

# This Red Panda Lineage dataset builder takes all source input data and
# creates a JSON file intended for family tree querying.

import configparser
from datetime import datetime
import json
import os

PANDA_PATH = "./pandas"
ZOO_PATH = "./zoos" 

class DateFormatError(ValueError):
    pass

class GenderFormatError(ValueError):
    pass

class PandaIdError(KeyError):
    pass

class NameFormatError(ValueError):
    pass

class ZooIdError(KeyError):
    pass

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
        self.vertices = []
        self.zoos = []
        self.panda_files = []
        self.zoo_files = []

    def build_graph(self):
        """Reads in all files to build a red panda graph."""
        self.import_file_tree(ZOO_PATH, self.import_zoo)
        self.import_file_tree(PANDA_PATH, self.import_redpanda)
        print(self.vertices)
        pass    

    def check_dataset_dates(self):
        """Run checks against the complete tree of red panda dates.

        - Birth date and date of death should not be reversed.
        - Child pandas should not be born before the parent.
        - Child pandas should not be born after the parent died.

        This requires the entire panda dataset to have been read.
        """
        pass

    def check_dataset_panda_ids(self):
        """Run checks against the complete index of red panda IDs.

        - No duplicate IDs should exist
        - The children IDs should be valid for only one red panda file
        - There should be no loops / I'm my own grandpa situations

        This requires the entire panda dataset to have been read.
        """
        pass

    def check_imported_date(self, date, sourcepath):
        """Dates should all be in the form of YYYY/MM/DD."""
        try:
            [year, month, day] = date.split("/")
            datetime.date(int(year), int(month), int(day))
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
        if len(name) > 80:
            raise NameFormatError("ERROR: %s: %s name too long: %s"
                                  % (sourcepath, field, name))
    
    def check_imported_zoo_id(self, zoo_id, sourcepath):
        """Validate that the ID for a panda's zoo is valid."""
        if zoo_id not in [zoo['_id'] for zoo in self.zoos]:
            raise ZooKeyError("ERROR: %s: zoo id doesn't exist: %s"
                              % (sourcepath, zoo_id))

    def export_json_graph(self, path):
        """Write a JSON representation of the Red Panda graph."""
        pass

    def import_file_tree(self, path, import_method):
        """Given starting path, import all files into the graph.
        
        By adjusting path and import_method, this is used to import either the
        panda data or the zoo data.
        """
        for _, subdir in enumerate(sorted(os.listdir(path))):
            subpath = os.path.join(path, subdir)
            if os.path.isdir(subpath):
                for _, subfile in enumerate(sorted(os.listdir(subpath))):
                    datafile = os.path.join(subpath, subfile)
                    if os.path.isfile(datafile) and datafile.lower().endswith(".txt"):
                        import_method(datafile)

    def import_redpanda(self, path):
        """Take a single red panda file and convert it into a Python dict.

        Panda files are expected to have a header of [panda]. Any fields defined
        under that header will be consumed into the pandas datastore. 
        
        Fields with specific formats, like dates or names or ids, get validated
        upon importing. This includes making sure birthplace and zoo refer to 
        valid zoos. Relationship fields or panda ID checks are deferred until the
        entire set of panda data is imported.

        Since pandas live at zoos and we need to check zoo references, the list
        of zoos must be imported prior to any red pandas being imported. 
        """
        panda_entry = {}
        infile = configparser.ConfigParser()
        infile.read(path, encoding='utf-8')
        for field in infile.items("panda"):
            if field[0].find("name") != -1:   # Name rule checking
                self.check_imported_name(field[1], field[0], path)
                panda_entry[field[0]] = field[1]
            elif field[0].find("gender") != -1:   # Gender rules
                gender = self.check_imported_gender(field[1], path)
                panda_entry[field[0]] = gender
            elif (field[0].find("birthplace") != -1 or
                  field[0].find("zoo") != -1):   # Zoo ID rules
                self.check_imported_zoo_id(field[1], path)
                panda_entry[field[0]] = field[1]
            else:   # Accept the data and move along
                panda_entry[field[0]] = field[1]
        self.vertices.append(panda_entry)
        self.panda_files.append(path) 

    def import_zoo(self, path):
        """Take a single zoo file and convert it into a Python dict.
        
        Zoo files are expected to have a header of [zoo]. Any fields defined
        under that header will be consumed into the zoo datastore.
        """
        zoo_entry = {}
        infile = configparser.ConfigParser()
        infile.read(path, encoding='utf-8')
        for field in infile.items("zoo"):
            zoo_entry[field[0]] = field[1]
        self.zoos.append(zoo_entry)
        self.zoo_files.append(path) 


if __name__ == '__main__':
    """Initialize all library settings, build, and export the database."""
    p = RedPandaGraph()
    p.build_graph()
    # p.export_json_graph()
