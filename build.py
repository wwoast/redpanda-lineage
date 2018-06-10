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

class NameFormatError(ValueError):
    pass

class RedPandaGraph:
    """Class with the redpanda database and format/consistency checks.

    The database is dict that becomes a JSON blob upon export.
    """
    def __init__(self):
        self.vertices = [{}]
        self.edges = {}
        self.panda_files = []
        self.zoo_files = []

    def check_dates(self):
       """Run checks against the complete tree of red panda dates.

       - Birth date and date of death should not be reversed.
       - Child pandas should not be born before the parent.
       - Child pandas should not be born after the parent died.
       """
       pass

    def check_imported_date(self, date, filename):
        """Dates should all be in the form of YYYY/MM/DD."""
        try:
            [year, month, day] = date.split("/")
            datetime.date(int(year), int(month), int(day))
        except ValueError as e:
            raise DateFormatError("ERROR: %s: invalid YYYY/MM/DD date: %s/%s/%s"
                                  % (filename, year, month, day))

    def check_imported_gender(self, gender, filename):
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
                                    % (filename, gender))

    def check_imported_name(self, name, filename):
        """Ensure the name strings are not longer than 80 characters.
    
        This limitation applies to zoos, pandas, and other details, and is
        intended to make text formatting simpler.
        """
        if len(name) > 80:
            raise NameFormatError("ERROR: %s: name too long: %s"
                                  % (filename, name))

    def check_imported_panda_id(self, panda_id):
        """Validate that the ID for a panda doesn't already exist."""
        pass
    
    def check_imported_panda_zoo_id(self, zoo_id):
        """Validate that the ID for a panda's zoo is valid."""
        pass

    def check_panda_children_ids(self):
        """Run checks against the complete index of red panda chilren's IDs.

        - No duplicate IDs should exist
        - The children IDs should be valid for only one red panda file
        - There should be no loops / I'm my own grandpa situations
        """
        pass

    def export_json_graph(self, path):
        """Write a JSON representation of the Red Panda graph."""
        pass

    def import_file_tree(self, path, import_method):
        """Given starting path, import all files into the graph.
        
        This can be used to import either the pandas, or the zoos.
        """
        for _, subdir in enumerate(sorted(os.listdir(path))):
            subpath = os.path.join(path, subdir)
            if os.path.isdir(subpath):
                for _, subfile in enumerate(sorted(os.listdir(subpath))):
                    datafile = os.path.join(subpath, subfile)
                    if os.path.isfile(datafile):
                        import_method(datafile)

    def import_redpanda(self, path):
        """Take a red panda file and convert it to JSON.

        Perform consistency checks on any red panda imported.
        """
        infile = configparser.ConfigParser()
        infile.read(path, encoding='utf-8')
        

        self.panda_files.append(path) 

    def import_zoo(self, path):
        """Take a zoo file and convert it to JSON."""
        self.zoo_files.append(path) 

    def build_graph(self):
        """Reads in all files to build a red panda graph.
        
        Vertices represent a panda and their info, while edges represent parent
        and child relationships between animals. In the example below, Karin is
        Harumaki's mom:
        
        - Vertices: [{ "_id":1,"en.name":"Harumaki", ...},
                     { "_id":10,"en.name":"Karin", ...}]
        -    Edges: [{"_out":10,"_in":1,"_label":"family"}]
        """
        self.import_file_tree(PANDA_PATH, self.import_redpanda)
        self.import_file_tree(ZOO_PATH, self.import_zoo)
        pass    


if __name__ == '__main__':
    """Initialize all library settings, build, and export the database."""
    p = RedPandaGraph()
    p.build_graph()
    # p.export_json_graph()
